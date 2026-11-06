
const {ready}=require('../server/request.cjs');
module.exports=function(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Método não permitido.'});}
  return res.status(200).json({ready:ready(),siteKey:process.env.TURNSTILE_SITE_KEY||null});
};
