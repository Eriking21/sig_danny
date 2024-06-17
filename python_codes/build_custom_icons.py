from PIL import Image, ImageDraw
import os

current_dir = os.path.dirname(os.path.abspath(__file__)) + "/../public/custom"

items = 2
colors: list[str] = ["red", "#80ed80", "yellow", "gray", "white"]
img_size:int = 512
icon_size:int = 300
diff_size:int = int((img_size-icon_size)/2)


for i in range(items):
    icon_path_begin: str = current_dir + "/icon_" + str(i)
    icon_path = icon_path_begin + ".png"
    icon = Image.open(icon_path).resize((icon_size, icon_size))

    for color in colors:
        final_path = icon_path_begin + "_" + color.removeprefix("#") + ".png"
        if not os.path.exists(final_path):
            image = Image.new("RGBA", (img_size, img_size), "#00000000")
            ImageDraw.Draw(image).ellipse(
                xy=(0, 0, img_size, img_size), fill=color, outline="white", width=20
            )
            image.paste(icon, (diff_size, diff_size), icon)
            image.save(final_path)
