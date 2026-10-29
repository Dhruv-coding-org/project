import os
import math
import struct
import wave
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(BASE_DIR, "assets", "fonts")
AUDIO_DIR = os.path.join(BASE_DIR, "assets", "audio")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
TEMP_DIR = os.path.join(BASE_DIR, "temp")

def create_folders():
    os.makedirs(FONTS_DIR, exist_ok=True)
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)

def download_font():
    font_path = os.path.join(FONTS_DIR, "Anton-Regular.ttf")
    if os.path.exists(font_path):
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
        print(f"Failed to download font: {e}. Will fall back to system font.")
        impact_path = "C:/Windows/Fonts/impact.ttf"
        if os.path.exists(impact_path):
            return impact_path
        return "C:/Windows/Fonts/arialbd.ttf"

def generate_tick_sound():
    path = os.path.join(AUDIO_DIR, "tick.wav")
    if os.path.exists(path):
        return path
    
    sample_rate = 44100
    duration = 0.08  # seconds
    frequency = 1000  # Hz
    volume = 0.3
    
    num_samples = int(sample_rate * duration)
    with wave.open(path, 'w') as wav_file:
        wav_file.setparams((1, 2, sample_rate, num_samples, 'NONE', 'not compressed'))
        for i in range(num_samples):
            t = float(i) / sample_rate
            decay = 1.0 - (t / duration)
            value = math.sin(2.0 * math.pi * frequency * t) * decay * volume
            packed_value = struct.pack('<h', int(value * 32767))
            wav_file.writeframes(packed_value)
    print("Generated tick.wav")
    return path

def generate_ding_sound():
    path = os.path.join(AUDIO_DIR, "ding.wav")
    if os.path.exists(path):
        return path
        
    sample_rate = 44100
    duration = 1.5  # seconds
    frequencies = [523.25, 659.25, 783.99]  # C5, E5, G5
    volume = 0.25
    
    num_samples = int(sample_rate * duration)
    with wave.open(path, 'w') as wav_file:
        wav_file.setparams((1, 2, sample_rate, num_samples, 'NONE', 'not compressed'))
        for i in range(num_samples):
            t = float(i) / sample_rate
            decay = math.exp(-3.0 * t)
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
