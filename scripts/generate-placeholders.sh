#!/bin/bash
IMAGES_DIR="images"

echo "Generating placeholder images..."

# Generate 20px wide blurred placeholders
ffmpeg -i "$IMAGES_DIR/bg.webp" -vf "scale=20:-1:flags=lanczos,gblur=sigma=10" -q:v 50 "$IMAGES_DIR/bg-placeholder.webp" -y
echo "✓ bg-placeholder.webp created"

ffmpeg -i "$IMAGES_DIR/bg2.webp" -vf "scale=20:-1:flags=lanczos,gblur=sigma=10" -q:v 50 "$IMAGES_DIR/bg2-placeholder.webp" -y
echo "✓ bg2-placeholder.webp created"

ffmpeg -i "$IMAGES_DIR/bg3.png" -vf "scale=20:-1:flags=lanczos,gblur=sigma=10" -q:v 50 "$IMAGES_DIR/bg3-placeholder.webp" -y
echo "✓ bg3-placeholder.webp created"

ffmpeg -i "$IMAGES_DIR/spirited_away.jpg" -vf "scale=20:-1:flags=lanczos,gblur=sigma=10" -q:v 50 "$IMAGES_DIR/spirited_away-placeholder.webp" -y
echo "✓ spirited_away-placeholder.webp created"

echo ""
echo "All placeholders generated successfully!"
echo ""
ls -lh "$IMAGES_DIR"/*-placeholder.webp
