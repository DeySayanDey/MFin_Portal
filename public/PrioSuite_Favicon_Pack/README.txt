PrioSuite website favicon

Uses the left P brand symbol with transparent background.
All PNGs are square (1:1), centered, and padded without stretching.

Files:
- favicon.ico: 16, 32, 48, 64, 128 and 256 pixel images in one file
- favicon-16x16.png
- favicon-32x32.png
- favicon-48x48.png
- favicon-192x192.png
- favicon-512x512.png
- apple-touch-icon.png: 180 x 180 pixels

Basic website installation:
Copy the icon files into your public web root. Add these tags to <head>:

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

Next.js App Router:
Place favicon.ico in app/favicon.ico, or src/app/favicon.ico if your
project uses a src directory. Choose the app directory your project uses.

If the browser still shows the old icon, refresh its cache.
