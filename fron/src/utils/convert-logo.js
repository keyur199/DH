const fs = require('fs');
const path = require('path');

const imgPath = 'C:\\Users\\K\\.gemini\\antigravity\\brain\\349747ab-b022-4be7-b189-e5e36f49cc98\\media__1774587596787.png';

try {
   const file = fs.readFileSync(imgPath);
   const base64 = file.toString('base64');
   const outPath = 'd:\\Keyur Dhameliya\\pro-billing-software-fixed\\pro-billing-software-fixed\\src\\utils\\logoData.js';
   fs.writeFileSync(outPath, `export const logoBase64 = "data:image/png;base64,${base64}";`);
   console.log("Successfully generated logoData.js");
} catch (e) {
   console.error(e);
}
