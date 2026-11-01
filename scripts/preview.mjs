import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const {basePath}=JSON.parse(await fs.readFile('content/presentation.json','utf8'));
const root=path.resolve('dist'),port=Number(process.env.PORT??4193);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf'};
http.createServer(async(req,res)=>{try{const requestPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);let file=path.resolve(root,'.'+requestPath);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}let stat=await fs.stat(file);if(stat.isDirectory()){if(!requestPath.endsWith('/')){res.writeHead(302,{Location:requestPath+'/'});res.end();return;}file=path.join(file,'index.html');}res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(await fs.readFile(file));}catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await fs.readFile(path.join(root,'404.html')));}}).listen(port,'127.0.0.1',()=>console.log('Portfolio preview: http://127.0.0.1:'+port+basePath+'/'));
