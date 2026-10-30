import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
async function files(dir){return(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
let rendered=0;
for(const pdf of (await files('assets')).filter(p=>p.endsWith('.pdf'))){
 const prefix=pdf.slice(0,-4)+'-preview',png=prefix+'.png';
 const original=await fs.stat(pdf),preview=await fs.stat(png).catch(()=>null);
 if(preview&&preview.mtimeMs>=original.mtimeMs)continue;
 const result=spawnSync('pdftoppm',['-f','1','-l','1','-scale-to','1200','-singlefile','-png',pdf,prefix],{encoding:'utf8'});
 if(result.error||result.status!==0)throw Error('PDF preview render failed: '+path.basename(pdf)+'. Install Poppler (pdftoppm).');
 rendered++;
}
console.log('PDF previews: '+rendered+' rendered; originals preserved.');
