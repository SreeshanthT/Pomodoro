import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeFileSync } from 'fs'

// Master source is the user's actual Canva export - not a hand-derived
// reconstruction. Every shipped icon asset is just a resize/format
// conversion of this one file, so it always matches the real design exactly.
const MASTER = 'branding/Ekagram.png'

async function renderPng(size) {
  return sharp(MASTER).resize(size, size).png().toBuffer()
}

// build/icon.png: app-icon/dock-icon scale - electron-builder derives macOS's
// .icns from this. Platforms apply their own corner mask, so the source
// stays a plain square, matching the Canva export as exported.
const full1024 = await renderPng(1024)
writeFileSync('build/icon.png', full1024)
console.log('wrote build/icon.png (1024)')

// resources/icon.png: runtime BrowserWindow icon (title bar / alt-tab / taskbar).
const runtime256 = await renderPng(256)
writeFileSync('resources/icon.png', runtime256)
console.log('wrote resources/icon.png (256)')

// build/icon.ico: multi-resolution ICO for Windows packaging.
const icoBuffer = await pngToIco([
  await renderPng(256),
  await renderPng(128),
  await renderPng(64),
  await renderPng(48),
  await renderPng(32),
  await renderPng(16)
])
writeFileSync('build/icon.ico', icoBuffer)
console.log('wrote build/icon.ico (256/128/64/48/32/16)')
