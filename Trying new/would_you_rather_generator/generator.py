import os
import json
import argparse
import asyncio
# pyrefly: ignore [missing-import]
import edge_tts
# pyrefly: ignore [missing-import]
from moviepy import (
    ImageClip,
    AudioFileClip,
    CompositeVideoClip,
    CompositeAudioClip,
    concatenate_videoclips
)
# pyrefly: ignore [missing-import]
from moviepy.audio.fx.AudioLoop import AudioLoop
# pyrefly: ignore [missing-import]
import moviepy.audio.io.readers
import numpy as np
import warnings

def patch_moviepy_reader():
    """Patches FFMPEG_AudioReader.get_frame in MoviePy to fix a recursion bug with boolean slicing."""
    def patched_get_frame(self, tt):
        if isinstance(tt, np.ndarray):
            if len(tt) == 0:
                return np.zeros((0, self.nchannels))
            in_time = (tt >= 0) & (tt < self.duration)
            if not in_time.any():
                return np.zeros((len(tt), self.nchannels))
            frames = np.round((self.fps * tt)).astype(int)[in_time]
            fr_min, fr_max = frames.min(), frames.max()
            max_frame_threshold = fr_min + self.buffersize // 2
            threshold_idx = np.searchsorted(frames, max_frame_threshold, side="right")
            if threshold_idx != len(frames) and threshold_idx > 0:
                # Slice the time array tt instead of the boolean array in_time
                tt_head = tt[0:threshold_idx]
                tt_tail = tt[threshold_idx:]
                return np.concatenate(
                    [self.get_frame(tt_head), self.get_frame(tt_tail)]
                )
            if not (0 <= (fr_min - self.buffer_startframe) < len(self.buffer)):
                self.buffer_around(fr_min)
            elif not (0 <= (fr_max - self.buffer_startframe) < len(self.buffer)):
                self.buffer_around(fr_max)
            try:
                result = np.zeros((len(tt), self.nchannels))
                indices = frames - self.buffer_startframe
                result[in_time] = self.buffer[indices]
                return result
            except IndexError as error:
                warnings.warn(
                    "Error in file %s, " % (self.filename)
                    + "At time t=%.02f-%.02f seconds, " % (tt[0], tt[-1])
                    + "indices wanted: %d-%d, " % (indices.min(), indices.max())
                    + "but len(buffer)=%d\n" % (len(self.buffer))
                    + str(error),
                    UserWarning,
                )
                indices[indices >= len(self.buffer)] = len(self.buffer) - 1
                result[in_time] = self.buffer[indices]
                return result
        else:
            ind = int(self.fps * tt)
            if ind < 0 or ind > self.n_frames:
                return np.zeros(self.nchannels)
            if not (0 <= (ind - self.buffer_startframe) < len(self.buffer)):
                self.buffer_around(ind)
            return self.buffer[ind - self.buffer_startframe]

    moviepy.audio.io.readers.FFMPEG_AudioReader.get_frame = patched_get_frame

# Apply the monkey patch immediately
patch_moviepy_reader()

import assets_manager
import renderer

async def _generate_tts_async(text: str, voice: str, output_path: str):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

def generate_tts(text: str, voice: str, output_path: str):
    """Generates the TTS voiceover using edge-tts."""
    print(f"Generating TTS voiceover: '{text}' using voice '{voice}'...")
    asyncio.run(_generate_tts_async(text, voice, output_path))
    print(f"TTS voiceover saved to {output_path}")

def make_safe_audio(clip):
    """Wraps an AudioClip to safely handle out-of-bounds time requests from MoviePy's CompositeAudioClip."""
    import numpy as np
    dur = clip.duration
    nchan = clip.nchannels
    
    def safe_frame_func(t):
        if isinstance(t, np.ndarray):
            out = np.zeros((len(t), nchan))
            valid_mask = (t >= 0) & (t < dur)
            if np.any(valid_mask):
                # Since t is strictly monotonic, find the continuous valid segment
                indices = np.where(valid_mask)[0]
                first_idx = indices[0]
                last_idx = indices[-1]
                
                # Fetch frames only for the valid time segment (which is monotonic and sorted)
                valid_t = t[first_idx:last_idx+1]
                valid_frames = clip.get_frame(valid_t)
                
                # Assign back into the output array
                out[first_idx:last_idx+1] = valid_frames
            return out
        else:
            return clip.get_frame(t) if 0 <= t < dur else np.zeros(nchan)
            
    return clip.with_updated_frame_function(safe_frame_func)

def render_question_video(q_data, assets, voice="en-US-ChristopherNeural", fps=30):
    """Renders a single question video clip using MoviePy."""
    q_id = q_data["id"]
    temp_dir = "temp"
    output_video_path = f"outputs/q_{q_id}.mp4"
    
    # 1. Generate Voiceover TTS
    tts_text = f"Would you rather: {q_data['option_a']}? Or: {q_data['option_b']}?"
    tts_audio_path = os.path.join(temp_dir, f"tts_{q_id}.mp3")
    generate_tts(tts_text, voice, tts_audio_path)
    
    # 2. Render background frames and countdown badges
    print("Generating Pillow base images and badges...")
    frame_paths = renderer.create_base_images(q_data, assets["font"], temp_dir)
    badge_paths = renderer.generate_countdown_badges(assets["font"], temp_dir)
    
    # Create the lists to hold clips we need to close later
    video_clips_to_close = []
    audio_clips_to_close = []
    
    # 3. Load audio files
    raw_tts_audio = AudioFileClip(tts_audio_path)
    tts_duration = raw_tts_audio.duration
    tts_audio = make_safe_audio(raw_tts_audio)
    audio_clips_to_close.extend([raw_tts_audio, tts_audio])
    
    # Define timing segments
    tts_phase_duration = tts_duration + 0.5  # Give half a second after TTS finishes
    countdown_duration = 5.0
    reveal_start = tts_phase_duration + countdown_duration
    reveal_duration = 3.5
    total_duration = reveal_start + reveal_duration
    
    print(f"Video Timeline:")
    print(f"  - TTS Phase: 0.0s to {tts_phase_duration:.2f}s (duration: {tts_phase_duration:.2f}s)")
    print(f"  - Countdown Phase: {tts_phase_duration:.2f}s to {reveal_start:.2f}s (duration: 5.0s)")
    print(f"  - Reveal Phase: {reveal_start:.2f}s to {total_duration:.2f}s (duration: 3.5s)")
    print(f"  - Total Video Duration: {total_duration:.2f}s")
    
    try:
        # 4. Background Clips
        bg_q_clip = ImageClip(frame_paths["question"]).with_duration(reveal_start).with_start(0)
        bg_r_clip = ImageClip(frame_paths["reveal"]).with_duration(reveal_duration).with_start(reveal_start)
        video_clips_to_close.extend([bg_q_clip, bg_r_clip])
        
        # 5. Center Badges overlays
        # OR badge during TTS phase
        or_clip = ImageClip(badge_paths["or"]).with_duration(tts_phase_duration).with_position("center").with_start(0)
        video_clips_to_close.append(or_clip)
        
        # Countdown badges (5, 4, 3, 2, 1) for 1s each
        countdown_clips = []
        for i in range(5):
            badge_name = str(5 - i)
            badge_clip = (
                ImageClip(badge_paths[badge_name])
                .with_duration(1.0)
                .with_position("center")
                .with_start(tts_phase_duration + i)
            )
            countdown_clips.append(badge_clip)
        video_clips_to_close.extend(countdown_clips)
        
        # Checkmark badge during reveal
        check_clip = (
            ImageClip(badge_paths["check"])
            .with_duration(reveal_duration)
            .with_position("center")
            .with_start(reveal_start)
        )
        video_clips_to_close.append(check_clip)
        
        # Combine all video overlays
        all_video_clips = [bg_q_clip, bg_r_clip, or_clip] + countdown_clips + [check_clip]
        composite_video = CompositeVideoClip(all_video_clips, size=(1080, 1920))
        
        # 6. Audio Tracks
        tts_track = tts_audio.with_start(0).with_volume_scaled(1.0)
        audio_clips_to_close.append(tts_track)
        
        # Countdown Tick sounds
        tick_tracks = []
        for i in range(5):
            raw_tick = AudioFileClip(assets["tick"])
            tick_track = (
                make_safe_audio(raw_tick)
                .with_start(tts_phase_duration + i)
                .with_volume_scaled(0.5)
            )
            tick_tracks.append(tick_track)
            audio_clips_to_close.extend([raw_tick, tick_track])
        
        # Ding chime sound at reveal start
        raw_ding = AudioFileClip(assets["ding"])
        ding_track = (
            make_safe_audio(raw_ding)
            .with_start(reveal_start)
            .with_volume_scaled(0.6)
        )
        audio_clips_to_close.extend([raw_ding, ding_track])
        
        all_audio_tracks = [tts_track] + tick_tracks + [ding_track]
        
        # Background music check
        bg_music_path = "assets/audio/background.mp3"
        bg_music_track = None
        if os.path.exists(bg_music_path):
            print("Found background.mp3! Mixing into audio tracks...")
            raw_music = AudioFileClip(bg_music_path)
            # Loop music to fit video duration and scale down volume
            bg_music_track = (
                make_safe_audio(raw_music)
                .with_effects([AudioLoop(duration=total_duration)])
                .with_volume_scaled(0.12)
                .with_start(0)
            )
            audio_clips_to_close.extend([raw_music, bg_music_track])
            all_audio_tracks.append(bg_music_track)
            
        composite_audio = CompositeAudioClip(all_audio_tracks)
        composite_video = composite_video.with_audio(composite_audio)
        
        # 7. Render Video
        print(f"Rendering video outputs to {output_video_path}...")
        composite_video.write_videofile(
            output_video_path,
            fps=fps,
            codec="libx264",
            audio_codec="aac",
            preset="medium",
            logger=None # Suppress verbose progress logs to keep stdout clean
        )
        print(f"Successfully generated {output_video_path}")
        return output_video_path
        
    finally:
        # Clean up moviepy open file handles to prevent file lock issues
        for clip in video_clips_to_close + audio_clips_to_close:
            try:
                clip.close()
            except Exception as e:
                pass

def main():
    parser = argparse.ArgumentParser(description="Would You Rather Video Generator")
    parser.add_argument("--test", action="store_true", help="Render only the first question as a test")
    parser.add_argument("--compile", action="store_true", help="Concatenate all generated questions into a single compilation video")
    parser.add_argument("--question_id", type=int, help="Render a specific question by ID")
    parser.add_argument("--voice", type=str, default="en-US-ChristopherNeural", help="Edge TTS Voice name")
    parser.add_argument("--fps", type=int, default=30, help="Video FPS")
    
    args = parser.parse_args()
    
    # Ensure setup is complete
    print("Setting up folders and sound/font assets...")
    assets = assets_manager.setup_assets()
    
    # Load Questions
    questions_file = "questions.json"
    if not os.path.exists(questions_file):
        raise FileNotFoundError(f"Could not find questions configuration at {questions_file}")
        
    with open(questions_file, "r") as f:
        questions = json.load(f)
        
    if not questions:
        print("No questions found in questions.json!")
        return
        
    # Filter questions based on args
    if args.test:
        print("Running in test mode. Selecting the first question only.")
        questions = [questions[0]]
    elif args.question_id is not None:
        questions = [q for q in questions if q["id"] == args.question_id]
        if not questions:
            print(f"No question found with ID {args.question_id}")
            return
            
    print(f"Found {len(questions)} question(s) to process.")
    
    generated_videos = []
    for q in questions:
        print("\n" + "="*50)
        print(f"Processing Question {q['id']}: {q['option_a']} vs {q['option_b']}")
        print("="*50)
        try:
            video_path = render_question_video(q, assets, voice=args.voice, fps=args.fps)
            generated_videos.append(video_path)
        except Exception as e:
            print(f"Failed to generate video for question {q['id']}: {e}")
            import traceback
            traceback.print_exc()
            
    # Concatenate compilation video if requested
    if args.compile and len(generated_videos) > 1:
        print("\n" + "="*50)
        print("Compiling all questions into a single compilation video...")
        print("="*50)
        compilation_output = "outputs/compilation.mp4"
        
        video_clips = []
        try:
            for path in generated_videos:
                video_clips.append(moviepy.VideoFileClip(path))
                
            final_clip = concatenate_videoclips(video_clips, method="compose")
            print(f"Rendering compilation video to {compilation_output}...")
            final_clip.write_videofile(
                compilation_output,
                fps=args.fps,
                codec="libx264",
                audio_codec="aac",
                preset="medium",
                logger=None
            )
            print(f"Successfully generated compilation video at {compilation_output}")
        except Exception as e:
            print(f"Failed to compile videos: {e}")
        finally:
            for clip in video_clips:
                try:
                    clip.close()
                except:
                    pass

if __name__ == "__main__":
    main()
