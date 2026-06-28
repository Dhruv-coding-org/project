import os
import math
import struct
import wave
import requests

def create_folders():
    os.makedirs("assets/fonts", exist_ok=True)
    os.makedirs("assets/audio", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)
    os.makedirs("temp", exist_ok=True)

def download_font():
    font_path = "assets/fonts/Anton-Regular.ttf"
    if os.path.exists(font_path):
        print("Font already exists.")
        return font_path

    url = "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf"
    print(f"Downloading font from {url}...")
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        with open(font_path, "wb") as f:
            f.write(r.content)
        print("Font downloaded successfully.")
        return font_path
    except Exception as e:
        print(f"Failed to download font: {e}. Will fall back to Windows Impact font.")
        # Return fallback system font path for Windows
        impact_path = "C:/Windows/Fonts/impact.ttf"
        if os.path.exists(impact_path):
            return impact_path
        return "C:/Windows/Fonts/arialbd.ttf"

def generate_tick_sound():
    path = "assets/audio/tick.wav"
    if os.path.exists(path):
        return path
    
    # Generate a short click/beep
    sample_rate = 44100
    duration = 0.08  # seconds
    frequency = 1000  # Hz
    volume = 0.3
    
    num_samples = int(sample_rate * duration)
    with wave.open(path, 'w') as wav_file:
        wav_file.setparams((1, 2, sample_rate, num_samples, 'NONE', 'not compressed'))
        for i in range(num_samples):
            t = float(i) / sample_rate
            # Linear decay to prevent clicking at the end
            decay = 1.0 - (t / duration)
            value = math.sin(2.0 * math.pi * frequency * t) * decay * volume
            packed_value = struct.pack('<h', int(value * 32767))
            wav_file.writeframes(packed_value)
    print("Generated tick.wav")
    return path

def generate_ding_sound():
    path = "assets/audio/ding.wav"
    if os.path.exists(path):
        return path
        
    # Generate a beautiful chime (major triad: C5, E5, G5)
    sample_rate = 44100
    duration = 1.5  # seconds
    frequencies = [523.25, 659.25, 783.99]  # C5, E5, G5
    volume = 0.25
    
    num_samples = int(sample_rate * duration)
    with wave.open(path, 'w') as wav_file:
        wav_file.setparams((1, 2, sample_rate, num_samples, 'NONE', 'not compressed'))
        for i in range(num_samples):
            t = float(i) / sample_rate
            # Exponential decay for bell-like sound
            decay = math.exp(-3.0 * t)
            
            # Combine frequencies
            signal = sum(math.sin(2.0 * math.pi * freq * t) for freq in frequencies) / len(frequencies)
            value = signal * decay * volume
            packed_value = struct.pack('<h', int(value * 32767))
            wav_file.writeframes(packed_value)
    print("Generated ding.wav")
    return path

def setup_assets():
    create_folders()
    font_path = download_font()
    tick_path = generate_tick_sound()
    ding_path = generate_ding_sound()
    return {
        "font": font_path,
        "tick": tick_path,
        "ding": ding_path
    }

if __name__ == "__main__":
    setup_assets()
