#!/usr/bin/env python3
"""Génère le catalogue et les sources LaTeX. N'écrase pas les .tex existants sans --refresh-tex."""
from pathlib import Path
import json, argparse, shutil, zipfile, subprocess, concurrent.futures, re
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(); p.add_argument('--compile',action='store_true'); p.add_argument('--refresh-tex',action='store_true'); p.add_argument('--chapter'); p.add_argument('--level',default='premiere',choices=['premiere','terminale','all']); args=p.parse_args()
def tex(s):
 return s.replace('&',r'\&').replace('%',r'\%').replace('_',r'\_').replace('#',r'\#')
def write_if(path,data):
 if not path.exists() or args.refresh_tex:path.write_text(data)
chapters=[]
for file in sorted((ROOT/'content').glob('[pt][0-9][0-9].json')):chapters.extend(json.loads(file.read_text()))
chapters=[c for c in chapters if args.level=='all' or c['level']==args.level]
for c in chapters:
 assert len(c['slides'])>=18,(c['id'],'slides'); assert len(c['exercises'])>=8; assert len(c['quiz'])>=8
 for q in c['quiz']:
  assert len(q['choices'])==4 and 0<=q['answer']<4
  assert len(set(q['choices']))==4,(c['id'],q)
 d=ROOT/'resources'/c['id'];d.mkdir(parents=True,exist_ok=True)
 for theme in ['theme-slides.tex','theme-fiches.tex']:shutil.copy(ROOT/'latex'/theme,d/theme)
 level='Première spécialité' if c['level']=='premiere' else 'Terminale complémentaires'
 slides=r'\documentclass[aspectratio=169,12pt]{beamer}'+'\n'+r'\input{theme-slides.tex}'+'\n'+r'\title{'+tex(c['title'])+'}\n'+r'\subtitle{'+level+'}\n'+r'\renewcommand{\chapternumber}{'+c['id'][1:]+'}'+r'\author{Maths Lycée}'+'\n'+r'\date{Année scolaire 2026--2027}'+'\n'+r'\begin{document}\begin{frame}\titlepage\end{frame}'+'\n'
 slides+=r'\begin{frame}{Objectifs du chapitre}\begin{itemize}'+'\n'+''.join(r'\item '+tex(o)+'\n' for o in c['objectives'])+r'\end{itemize}\end{frame}'+'\n'
 for slide in c['slides']:
  title=slide['title'].lower()
  kind='MÉTHODE & EXEMPLE' if any(x in title for x in ['calcul','exemple','étape','méthode','résol','équation','choisir']) else ('JUSTIFIER' if any(x in title for x in ['preuve','pourquoi','démonstr','justif']) else ('À RETENIR' if any(x in title for x in ['bilan','erreur','contrôl','vérif']) else 'COMPRENDRE'))
  body=slide['body']
  if r'\begin{tikzpicture}' in body:
   m=re.search(r'\\begin\{center\}(.*?)\\end\{center\}(.*)',body,re.S)
   if m: body=r'\begin{columns}[c,onlytextwidth]\begin{column}{.60\textwidth}\centering\begin{adjustbox}{max width=\linewidth,max height=3.7cm}'+m[1]+r'\end{adjustbox}\end{column}\begin{column}{.36\textwidth}'+m[2]+r'\end{column}\end{columns}'
  slides+=r'\renewcommand{\slidekind}{'+tex(kind)+'}\n'+r'\begin{frame}[t,fragile]{'+tex(slide['title'])+'}\n'+body+'\n'+r'\end{frame}'+'\n'
 for i,q in enumerate([c['quiz'][1],c['quiz'][-1]],1):
  slides+=r'\renewcommand{\slidekind}{À VOUS DE JOUER}'+r'\begin{frame}[t]{Vérification des acquis '+str(i)+'}\n'+q['question']+r'\begin{enumerate}'+'\n'+''.join(r'\item '+x+'\n' for x in q['choices'])+r'\end{enumerate}\medskip Une seule réponse est correcte. Justifier votre choix.\end{frame}'+'\n'
  slides+=r'\renewcommand{\slidekind}{COMPRENDRE LA RÉPONSE}'+r'\begin{frame}[t]{Vérification '+str(i)+' : résolution}\n'+r'\begin{block}{Réponse '+str(q['answer']+1)+'}'+q['choices'][q['answer']]+r'\end{block}\medskip '+q['explanation']+r'\end{frame}'+'\n'

 slides+=r'\end{document}'+'\n';write_if(d/'cours.tex',slides)
 for kind,key in [('exercices','statement'),('correction','correction')]:
  label='Exercices' if kind=='exercices' else 'Corrigé détaillé'
  body=r'\documentclass[11pt,a4paper]{article}'+'\n'+r'\newcommand{\fichetype}{'+label+'}\n'+r'\input{theme-fiches.tex}'+'\n'+r'\begin{document}'+'\n'+r'{\small\color{Blue}'+tex(level.upper())+r'}\par{\LARGE\bfseries '+tex(c['title'])+r'}\par{\large '+label+r'}\par\vspace{0.2cm}\hrule\vspace{0.4cm}'+'\n'
  if kind=='exercices':body+='Les exercices progressent de l’application directe vers la recherche. Détailler les calculs et justifier les réponses.\n'
  for i,e in enumerate(c['exercises'],1):
   body+=r'\par\noindent\begin{minipage}{\linewidth}'+r'\exercice{'+str(i)+'}{'+tex(e['difficulty'])+'}{'+tex(e['title'])+'}\n'
   if kind=='correction':body+=r'{\small\color{Muted}\textbf{Énoncé.} '+e['statement']+'}\n'+r'\par\medskip'+'\n'+r'\textbf{Résolution.}\par'+'\n'
   body+=e[key]+'\n'+r'\end{minipage}\par'+'\n'
  body+=r'\end{document}'+'\n';write_if(d/(kind+'.tex'),body)
 def compile_file(f):
  build=ROOT/'.build'/c['id'];build.mkdir(parents=True,exist_ok=True)
  for i in range(2):
   proc=subprocess.run(['pdflatex','-interaction=nonstopmode','-halt-on-error','-output-directory',str(build),f.name],cwd=d,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
   if proc.returncode: return (str(f),False,proc.stdout.decode(errors='replace')[-2400:])
  shutil.copy(build/(f.stem+'.pdf'),d/(f.stem+'.pdf'))
  log=(build/(f.stem+'.log')).read_text(errors='replace')
  warnings=[line for line in log.splitlines() if 'Overfull' in line]
  return (str(f),True,warnings)
 if args.compile and (not args.chapter or args.chapter==c['id']):
  with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
   for f,ok,result in pool.map(compile_file,[d/'cours.tex',d/'exercices.tex',d/'correction.tex']):
    print(json.dumps({'file':f,'ok':ok,'details':result},ensure_ascii=False),flush=True)
    if not ok:raise SystemExit(1)
 with zipfile.ZipFile(d/'sources-latex.zip','w',zipfile.ZIP_DEFLATED) as z:
  for f in d.glob('*.tex'):z.write(f,f.name)
 c['slideCount']=len(c['slides'])+6;c['exerciseCount']=len(c['exercises'])
# Catalogue léger : les sources pédagogiques complètes restent dans content/.
public=[{k:v for k,v in c.items() if k not in ['slides','exercises']} for c in chapters]
(ROOT/'catalogue.js').write_text('window.CATALOGUE = '+json.dumps(public,ensure_ascii=False)+';\n')
print(f'{len(chapters)} chapitres générés.')
