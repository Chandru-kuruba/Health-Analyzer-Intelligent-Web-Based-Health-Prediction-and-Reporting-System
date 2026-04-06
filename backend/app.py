import pyautogui
import time
import keyboard

print("Move mouse to target position...")
time.sleep(5)

print("Auto-clicker started. Press '1' to stop.")

while True:
    if keyboard.is_pressed('1'):
        print("Stopped by user")
        break

    pyautogui.click()
    print("Clicked")

    # wait 20 seconds but still check for key press
    for _ in range(30):
        if keyboard.is_pressed('1'):
            print("Stopped by user")
            exit()
        time.sleep(1)