/* Interface modifiable sans compilation. Contenus : content/*.json. */
'use strict';
const chapters=window.CATALOGUE||[];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage={get(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let level='premiere',scores=storage.get('maths-lycee-scores',{}),quiz=null;
const theme=storage.get('maths-lycee-theme','light');
function setTheme(t){document.documentElement.dataset.theme=t;$('#theme').setAttribute('aria-label',t==='dark'?'Activer le thème clair':'Activer le thème sombre');storage.set('maths-lycee-theme',t)}
setTheme(theme);$('#theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
function math(el){if(window.renderMathInElement)renderMathInElement(el,{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false}],throwOnError:false,trust:false,strict:'ignore',macros:{'\\R':'\\mathbb{R}','\\N':'\\mathbb{N}','\\E':'\\mathbb{E}'}})}
function normal(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function renderLibrary(){
 const query=normal($('#search').value.trim());
 const shown=chapters.filter(c=>c.level===level&&normal([c.title,c.description,c.domain,...c.coverage].join(' ')).includes(query));
 $('#level-description').textContent=level==='premiere'?'Première spécialité · 4 h par semaine · Programme 2026':'Terminale complémentaires · 3 h par semaine · Programme 2019';
 $('#result-count').textContent=shown.length+' chapitre'+(shown.length>1?'s':'');
 document.querySelectorAll('[data-level]').forEach(b=>{b.classList.toggle('active',b.dataset.level===level);b.setAttribute('aria-pressed',String(b.dataset.level===level))});
 $('#chapters').innerHTML=shown.map(c=>`<a class="chapter-card" href="#chapitre/${c.id}"><div class="card-top"><span class="chapter-number">${c.id.slice(1)}</span><span>${esc(c.domain)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p>${scores[c.id]?`<span class="score-pill">Dernier QCM : ${scores[c.id].score}/${scores[c.id].total}</span>`:''}<div class="card-bottom"><span>Cours · Exercices · Corrigé · QCM</span><span class="arrow" aria-hidden="true">↗</span></div></a>`).join('');
 $('#empty').hidden=!!shown.length;
}
$('#search').addEventListener('input',renderLibrary);
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=b.dataset.level;$('#search').value='';renderLibrary()});
$('#chapter-count').textContent=chapters.length;$('#question-count').textContent=chapters.reduce((n,c)=>n+c.quiz.length,0);
document.querySelectorAll('[data-level]').forEach(b=>b.querySelector('span').textContent=chapters.filter(c=>c.level===b.dataset.level).length);
$('#clear-progress').onclick=()=>{scores={};storage.set('maths-lycee-scores',scores);$('#clear-status').textContent='Tes résultats enregistrés ont été effacés.';renderLibrary()};
function resource(c,file,title,desc){return `<div class="resource-row"><div><strong>${title}</strong><p>${desc}</p></div><div class="resource-links"><a href="resources/${c.id}/${file}.pdf" target="_blank" rel="noopener" aria-label="Ouvrir le PDF : ${title}">PDF ↗</a><a href="resources/${c.id}/${file}.tex" download aria-label="Télécharger le fichier LaTeX : ${title}">LaTeX ↓</a></div></div>`}
function detail(c){
 const index=chapters.indexOf(c),next=chapters[index+1];
 $('#detail').innerHTML=`<a class="back" href="#${c.level}">← ${c.level==='premiere'?'Première spécialité':'Terminale complémentaires'}</a><div class="detail-hero"><p class="eyebrow">CHAPITRE ${c.id.slice(1)} · ${esc(c.domain)}</p><h1>${esc(c.title)}</h1><p class="description">${esc(c.description)}</p><div class="tags"><span>${c.slideCount} diapositives</span><span>${c.exerciseCount} exercices corrigés</span><span>${c.quiz.length} questions interactives</span></div></div><div class="detail-layout"><div><h2>Les ressources du chapitre</h2><div class="resource-list">${resource(c,'cours','Le cours',`${c.slideCount} diapositives · Définitions, méthodes et exemples`)}${resource(c,'exercices','La feuille d’exercices','Application, entraînement et approfondissement')}${resource(c,'correction','Le corrigé détaillé','Les étapes de résolution et les justifications')}</div><div class="source-download"><a class="button" href="resources/${c.id}/sources-latex.zip" download>Toutes les sources LaTeX ↓</a><p>Le ZIP inclut les trois documents et les fichiers du thème. <a href="#guide">Comment les modifier ↗</a></p></div><details class="pdf-panel"><summary>Feuilleter le cours sur cette page</summary><iframe loading="lazy" src="resources/${c.id}/cours.pdf#view=FitH" title="Diaporama : ${esc(c.title)}"></iframe></details></div><aside class="side-note"><h3>À savoir avant de commencer</h3><ul>${c.prerequisites.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3>Ce que tu vas apprendre</h3><ul>${c.objectives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></aside></div><section class="quiz" id="qcm"><p class="eyebrow">À TOI DE JOUER</p><h2>Vérifier mes connaissances.</h2><p>Une seule bonne réponse par question. La correction apparaît après validation.</p><div id="quiz-content"></div></section><div class="next-chapter"><a href="#${c.level}">← Tous les chapitres</a>${next&&next.level===c.level?`<a href="#chapitre/${next.id}">Chapitre suivant : ${esc(next.title)} →</a>`:''}</div>`;
 startQuiz(c,c.quiz.map((_,i)=>i));math($('#detail'));
}
function startQuiz(c,indices){quiz={chapter:c,indices,pos:0,responses:[],locked:false};renderQuestion()}
function renderQuestion(){
 const q=quiz.chapter.quiz[quiz.indices[quiz.pos]],n=quiz.indices.length;
 $('#quiz-content').innerHTML=`<div class="quiz-box"><div class="quiz-meta"><span>Question ${quiz.pos+1} sur ${n}</span><span>${quiz.responses.filter(x=>x.correct).length} bonne${quiz.responses.filter(x=>x.correct).length>1?'s':''} réponse${quiz.responses.filter(x=>x.correct).length>1?'s':''}</span></div><div class="progress-track"><div class="progress-fill" style="width:${quiz.pos/n*100}%"></div></div><form id="quiz-form"><fieldset><legend class="question">${esc(q.question)}</legend><div class="choices">${q.choices.map((v,i)=>`<label class="choice"><input type="radio" name="answer" value="${i}" required><span>${esc(v)}</span></label>`).join('')}</div></fieldset><div id="feedback" aria-live="polite"></div><div class="quiz-actions"><button class="button primary" id="validate" type="submit">Valider ma réponse</button><button class="button" id="next-question" type="button" hidden>${quiz.pos===n-1?'Voir mon bilan':'Question suivante →'}</button></div></form></div>`;
 $('#quiz-form').onsubmit=e=>{e.preventDefault();if(quiz.locked)return;const selected=$('input[name=answer]:checked');if(!selected)return;quiz.locked=true;const answer=Number(selected.value),correct=answer===q.answer;quiz.responses.push({index:quiz.indices[quiz.pos],answer,correct});document.querySelectorAll('.choice').forEach((label,i)=>{label.querySelector('input').disabled=true;if(i===q.answer)label.classList.add('correct');if(i===answer&&!correct)label.classList.add('wrong')});$('#feedback').innerHTML=`<div class="feedback"><strong style="color:var(--${correct?'good':'bad'})">${correct?'Bonne réponse.':'À retravailler.'}</strong><p>${esc(q.explanation)}</p>${!correct?`<p>Bonne réponse : ${esc(q.choices[q.answer])}</p>`:''}</div>`;$('#validate').hidden=true;$('#next-question').hidden=false;math($('#feedback'));$('#next-question').focus()};
 $('#next-question').onclick=()=>{quiz.pos++;quiz.locked=false;if(quiz.pos<n){renderQuestion();$('#quiz-content legend').tabIndex=-1;$('#quiz-content legend').focus()}else finishQuiz()};math($('#quiz-content'));
}
function finishQuiz(){
 const c=quiz.chapter,score=quiz.responses.filter(x=>x.correct).length,missed=quiz.responses.filter(x=>!x.correct).map(x=>x.index),isFull=quiz.indices.length===c.quiz.length;
 if(isFull){scores[c.id]={score,total:c.quiz.length};storage.set('maths-lycee-scores',scores)}
 $('#quiz-content').innerHTML=`<div class="quiz-box quiz-result"><p class="eyebrow">${isFull?'BILAN DU CHAPITRE':'BILAN DE LA REPRISE'}</p><h3>${score} / ${quiz.indices.length}</h3><p>${missed.length?'Les questions ci-dessous indiquent les notions à reprendre. Relis leurs explications, puis essaie à nouveau.':'Toutes les réponses sont correctes. Poursuis avec la feuille d’exercices pour travailler la rédaction.'}</p><div class="quiz-actions"><button class="button primary" id="restart">Recommencer tout le QCM</button>${missed.length?'<button class="button" id="retry">Reprendre mes erreurs</button>':''}</div><div>${quiz.responses.map(r=>{const q=c.quiz[r.index];return `<div class="review-item"><h4>${r.correct?'✓':'○'} ${esc(q.question)}</h4><p><strong>Réponse :</strong> ${esc(q.choices[q.answer])}</p><p>${esc(q.explanation)}</p></div>`}).join('')}</div></div>`;
 $('#restart').onclick=()=>startQuiz(c,c.quiz.map((_,i)=>i));if(missed.length)$('#retry').onclick=()=>startQuiz(c,missed);math($('#quiz-content'));$('#quiz-content h3').tabIndex=-1;$('#quiz-content h3').focus();
}
function route(){
 const hash=location.hash.slice(1);$('#home').hidden=true;$('#detail').hidden=true;$('#guide').hidden=true;
 if(hash.startsWith('chapitre/')){const c=chapters.find(c=>c.id===hash.split('/')[1]);if(c){$('#detail').hidden=false;detail(c);document.title=c.title+' · Maths Lycée';window.scrollTo(0,0);return}}
 if(hash==='guide'){$('#guide').hidden=false;document.title='Mode d’emploi · Maths Lycée';window.scrollTo(0,0);return}
 $('#home').hidden=false;if(hash==='premiere'||hash==='terminale'){level=hash;$('#search').value=''}renderLibrary();document.title='Maths Lycée · Comprendre, s’entraîner, progresser';if(hash==='premiere'||hash==='terminale')$('#library').scrollIntoView();else window.scrollTo(0,0)
}
window.addEventListener('hashchange',route);route();
