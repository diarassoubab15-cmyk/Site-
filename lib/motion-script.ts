/**
 * Script intégré dans <head> (≈ 1 Ko), exécuté avant l'affichage, indépendant de React :
 * - joue l'écran d'ouverture (1 fois par session, jamais en mouvement réduit ni dans les espaces privés)
 *   et le termine à 1,3 s sans attendre React : rien n'est retardé sur connexion lente ;
 * - fait apparaître les cartes en cascade au défilement (IntersectionObserver) ;
 * - onde au toucher sur les boutons et vibration légère sur les actions importantes.
 * Sans JavaScript, rien n'est masqué.
 */
export const motionScript = `(function(){
var d=document.documentElement;d.classList.add('nx-js');
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var priv=/^.(admin|vendeur|compte|connexion)/.test(location.pathname);
try{if(!reduce&&!priv&&!sessionStorage.getItem('nx-intro')){d.classList.add('nx-intro');
var done=false;var finish=function(){if(done)return;done=true;try{sessionStorage.setItem('nx-intro','1');}catch(e){}
var el=document.getElementById('intro');if(el)el.classList.add('is-leaving');setTimeout(function(){d.classList.remove('nx-intro');},400);};
setTimeout(finish,1300);
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#intro-skip'))finish();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')finish();});}}catch(e){}
function show(el){el.setAttribute('data-in','');}
var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target);}});},{rootMargin:'0px 0px -40px 0px',threshold:0.05}):null;
function scan(root){(root.querySelectorAll?root.querySelectorAll('[data-reveal]:not([data-in])'):[]).forEach(function(el){if(!io||reduce){show(el);}else{io.observe(el);}});}
document.addEventListener('DOMContentLoaded',function(){
scan(document);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1){if(n.hasAttribute('data-reveal'))scan(n.parentNode||n);scan(n);}});});}).observe(document.body,{childList:true,subtree:true});
});
document.addEventListener('pointerdown',function(e){
if(reduce)return;var b=e.target.closest&&e.target.closest('.btn,.btn-solid,.btn-danger');if(!b||b.disabled)return;
var r=b.getBoundingClientRect(),s=Math.max(r.width,r.height)*2,sp=document.createElement('span');
sp.className='ripple';sp.style.width=sp.style.height=s+'px';sp.style.left=(e.clientX-r.left-s/2)+'px';sp.style.top=(e.clientY-r.top-s/2)+'px';
b.appendChild(sp);setTimeout(function(){sp.remove();},600);
},{passive:true});
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-haptic]');if(t&&navigator.vibrate){try{navigator.vibrate(10);}catch(x){}}},{passive:true});
})();`;
