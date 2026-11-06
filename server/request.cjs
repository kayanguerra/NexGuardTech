
const {createHash}=require('node:crypto');
const business=require('../config/business.cjs');
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const states=new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
function ready(){
  return Boolean(process.env.RESEND_API_KEY&&process.env.MAIL_FROM&&emailPattern.test(process.env.MAIL_TO||'')&&process.env.MAIL_TO_CONFIRMED==='true'&&process.env.ALLOWED_ORIGINS&&process.env.TURNSTILE_SITE_KEY&&process.env.TURNSTILE_SECRET_KEY&&process.env.TURNSTILE_HOSTNAMES);
}
function validate(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Dados inválidos.');
  const limits={name:120,email:254,phone:22,person:2,company:120,mode:10,city:120,state:2,service:120,message:5000,period:120,website:200,requestId:36,token:2048,flow:7};
  const d={};
  for(const [k,max]of Object.entries(limits)){
    if(raw[k]!==undefined&&typeof raw[k]!=='string')throw Error('Dados inválidos.');
    d[k]=(raw[k]||'').trim();
    if(d[k].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(d[k]))throw Error('Campo inválido: '+k);
  }
  if(!['quote','support'].includes(d.flow)||!['pf','pj'].includes(d.person)||!['remoto','presencial'].includes(d.mode))throw Error('Selecione o tipo de solicitação, cliente e modalidade.');
  if(d.name.length<2||/[\r\n]/.test(d.name)||!emailPattern.test(d.email)||/[\r\n]/.test(d.email))throw Error('Informe nome e e-mail válidos.');
  const phone=d.phone.replace(/\D/g,'');
  if(!/^[+0-9() .-]+$/.test(d.phone)||phone.length<10||phone.length>13)throw Error('Informe WhatsApp com DDD.');
  if(d.person==='pj'&&!d.company)throw Error('Informe o nome da empresa.');
  if((d.flow==='quote'||d.mode==='presencial')&&(!d.city||!states.has(d.state)))throw Error('Informe cidade e estado.');
  if(d.state&&!states.has(d.state))throw Error('Estado inválido.');
  if(d.flow==='quote'&&![...business.services,'Ainda não sei','Resultado do checkup de TI'].includes(d.service))throw Error('Selecione um serviço válido.');
  if(!d.service||d.message.length<10)throw Error('Informe o serviço e descreva a necessidade com pelo menos 10 caracteres.');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.requestId))throw Error('Identificação inválida. Atualize a página.');
  if(!d.token||d.website)throw Error('Não foi possível validar a solicitação.');
  return d;
}
async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const fail=(status,error)=>res.status(status).json({error});
  if(req.method!=='POST'){res.setHeader('Allow','POST');return fail(405,'Método não permitido.');}
  if(!ready())return fail(503,'O envio está em configuração. Utilize o WhatsApp.');
  const origins=process.env.ALLOWED_ORIGINS.split(',').map(x=>x.trim());
  if(!origins.includes(req.headers.origin))return fail(403,'Origem não autorizada.');
  if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return fail(415,'Formato não permitido.');
  if(Number(req.headers['content-length']||0)>32768)return fail(413,'Solicitação muito longa.');
  let data;
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(Buffer.byteLength(JSON.stringify(body)||'')>32768)return fail(413,'Solicitação muito longa.');
    data=validate(body);
  }catch(error){return fail(400,error instanceof SyntaxError?'Dados inválidos.':error.message);}
  try{
    const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:process.env.TURNSTILE_SECRET_KEY,response:data.token}),signal:AbortSignal.timeout(7000)
    });
    if(!verification.ok)return fail(503,'Verificação indisponível. Tente novamente.');
    const check=await verification.json();
    if(!check.success||check.action!=='request'||!process.env.TURNSTILE_HOSTNAMES.split(',').map(x=>x.trim()).includes(check.hostname))return fail(400,'Verificação expirada ou inválida. Conclua a verificação e tente novamente.');
    const {token,website,requestId,...safe}=data;
    const digest=createHash('sha256').update(JSON.stringify(safe)).digest('hex');
    const text=[
      data.flow==='support'?'Pedido de suporte':'Solicitação de orçamento',
      'Nome: '+data.name,'E-mail: '+data.email,'WhatsApp: '+data.phone,
      'Cliente: '+(data.person==='pj'?'Pessoa jurídica':'Pessoa física'),
      data.person==='pj'?'Empresa: '+data.company:null,
      'Modalidade: '+data.mode,'Local: '+[data.city,data.state].filter(Boolean).join(' / '),
      'Serviço / equipamento: '+data.service,data.period?'Melhor período: '+data.period:null,
      '',data.message
    ].filter(x=>x!==null).join('\n');
    const result=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'nexguard-'+requestId+'-'+digest},
      body:JSON.stringify({from:process.env.MAIL_FROM,to:[process.env.MAIL_TO],reply_to:data.email,subject:data.flow==='support'?'NexGuard — Pedido de suporte':'NexGuard — Solicitação de orçamento',text}),
      signal:AbortSignal.timeout(12000)
    });
    if(!result.ok)return fail(result.status===429?429:502,'Não foi possível confirmar o envio. Seus dados foram mantidos. Tente novamente ou utilize o WhatsApp.');
    const receipt=await result.json();
    if(!receipt.id)return fail(502,'Não foi possível confirmar o envio. Tente novamente.');
    return res.status(200).json({sent:true});
  }catch{
    return fail(502,'Não foi possível confirmar o envio. Seus dados foram mantidos. Tente novamente ou utilize o WhatsApp.');
  }
}
module.exports={handler,validate,ready};
