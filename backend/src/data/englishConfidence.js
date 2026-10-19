// 30 carefully chosen beginner concepts, each practised on three different days.
// 90 short lessons, 3 MCQs per lesson. Technical vocabulary stays familiar.
const concepts = [
["I am / You are","Use am with I, are with you.","I ___ a mechanical engineer.|am|is|are","You ___ a designer.|are|am|is","We ___ learning CATIA.|are|is|am"],
["He is / She is","Use is with he, she and it.","He ___ my trainer.|is|are|am","She ___ a design engineer.|is|am|are","It ___ a plastic part.|is|are|am"],
["A / An","Use an before a vowel sound; a before most consonant sounds.","I am ___ engineer.|an|a|the","This is ___ CAD model.|a|an|are","She has ___ idea.|an|a|is"],
["One / Many","Use plural -s for many regular nouns.","Two ___ are ready.|parts|part|partes","I have three ___.|files|file|filees","These are CAD ___.|models|model|modeles"],
["This / That","This is near you; that is farther away.","___ is my laptop here.|This|Those|These","___ is the machine over there.|That|These|This","___ part here is new.|This|Those|These"],
["Have / Has","Use have with I/you/we/they; has with he/she.","I ___ a laptop.|have|has|having","He ___ a CATIA file.|has|have|having","They ___ an interview.|have|has|having"],
["Do / Does","Use does with he/she/it; do with I/you/we/they.","___ you know CATIA?|Do|Does|Is","___ she work here?|Does|Do|Are","___ they need help?|Do|Does|Is"],
["Not / Don't / Doesn't","Use do not or don't with I/you/we/they; doesn't with he/she.","I ___ know the answer.|don't|doesn't|isn't","He ___ use NX.|doesn't|don't|aren't","They ___ work on Sunday.|don't|doesn't|isn't"],
["Can / Cannot","Can means ability or permission; cannot means unable.","I ___ create a 3D model.|can|am|has","___ you help me?|Can|Has|Is","I ___ attend today; I am sick.|cannot|can|am"],
["Polite Requests","Use please, could and may to sound respectful.","___ you please repeat?|Could|Has|Does","___ I ask a question?|May|Has|Am","Please ___ the file.|share|sharing|shares"],
["Simple Present","Use present simple for habits and regular work.","I ___ CATIA daily.|practice|practices|practiced","He ___ in Pune.|works|work|working","We ___ designs.|create|creates|created"],
["Present Continuous","Use am/is/are + verb-ing for actions happening now.","I am ___ a model.|creating|create|created","She is ___ the drawing.|checking|check|checks","They are ___ today.|working|work|worked"],
["Simple Past","Use the past form for completed actions.","I ___ the file yesterday.|saved|save|saving","We ___ CATIA last month.|learned|learn|learning","He ___ me yesterday.|called|call|calling"],
["Simple Future","Use will + base verb for future actions.","I ___ join tomorrow.|will|was|did","We will ___ the model.|finish|finished|finishing","She ___ call later.|will|is|has"],
["Present Perfect Basics","Use have/has + past participle for completed work relevant now.","I have ___ the task.|completed|complete|completing","She has ___ the email.|sent|send|sending","We have ___ the drawing.|checked|check|checking"],
["Time Words","Use yesterday for past, tomorrow for future and today for now.","I worked ___ .|yesterday|tomorrow|next week","I will attend ___ .|tomorrow|yesterday|last week","I am free ___ .|today|last year|yesterday"],
["In / On / At","Use in for months/cities, on for days, at for clock times.","The interview is ___ Monday.|on|in|at","The meeting is ___ 10 AM.|at|on|in","I live ___ Pune.|in|on|at"],
["There is / There are","Use there is for one; there are for many.","There ___ one error.|is|are|am","There ___ three parts.|are|is|am","There ___ a problem.|is|are|am"],
["Question Words","What asks about things, where about places, when about time.","___ is your name?|What|Where|When","___ do you live?|Where|What|Who","___ is the interview?|When|Who|What"],
["Because / But / And","Because gives a reason; but contrasts; and joins ideas.","I stayed home ___ I was sick.|because|but|and","CATIA is useful ___ I need practice.|but|because|or","I know CATIA ___ NX.|and|because|but"],
["Work Updates","Use short, clear sentences to report work.","I have ___ the model.|completed|complete|completing","The drawing is ___ review.|under|on|at","I will ___ it today.|submit|submitted|submitting"],
["Asking for Help","Be polite and explain what you need.","Could you ___ me?|help|helps|helped","I have a ___ about this part.|question|questions|asking","Please ___ this step.|explain|explained|explains"],
["Explaining CAD Work","Use familiar action verbs for CAD tasks.","I ___ the 3D model in CATIA.|created|creating|creation","The part is made of ___.|plastic|plastics are|plastically","I checked the ___ dimensions.|part|parts is|parting"],
["Professional WhatsApp","Keep messages polite, specific and short.","Good morning, ___ .|sir|yesterday|because","Please ___ my resume.|find|finding|found","Thank you ___ your time.|for|on|at"],
["Basic Email","Use a clear subject and polite closing.","Please find my resume ___.|attached|attach|attaching","I am writing to ___ for the role.|apply|applied|applying","Thank you for your ___.|consideration|consider|considering"],
["Interview Introduction","Introduce your name, education and skills simply.","I am a mechanical engineering ___.|graduate|graduated|graduating is","I have learned ___.|CATIA|learn|learning","I am looking for an ___.|opportunity|opportunities is|opportune"],
["Explaining Projects","Describe what you did in a project.","I ___ on a door trim project.|worked|working|works","My role was to ___ the model.|design|designed|designing","I used CATIA ___ the project.|for|on|at"],
["Strengths and Learning","Speak truthfully using simple sentences.","My strength is ___.|teamwork|teamworking|teams work","I am willing to ___.|learn|learned|learning","I want to ___ my skills.|improve|improved|improving"],
["Career and Joining","Explain your career goals and availability.","I want to become a design ___.|engineer|engineering|engineered","I can join ___ Monday.|on|in|at","I am ___ for an interview.|available|availability|avail"],
["HR Final Practice","Answer common HR questions clearly and politely.","Why should we ___ you?|hire|hired|hiring","I am interested ___ this role.|in|on|at","Thank you for this ___.|opportunity|opportunities are|opportune"]
];
const interviewAnswers = [
"My name is Rahul. I am a mechanical engineering graduate. I have learned CATIA. I want to work as a design engineer.",
"I worked on a plastic door trim project. I created the 3D model in CATIA and checked its dimensions.",
"My strength is that I am willing to learn. I practise regularly and ask questions when I need help.",
"I want to build my career in automotive design. I am ready to learn and contribute to the team.",
"Thank you for this opportunity. I am interested in this role and can join as discussed."
];
function buildDays() {
  return Array.from({length:90},(_,i)=>{
    const day=i+1, index=Math.floor(i/3), round=i%3;
    const [title,rule,...items]=concepts[index];
    const questions=items.map((item,q)=>{
      const [prompt,correct,...wrong]=item.split("|");
      const options=[correct,...wrong];
      const shift=(day+q)%3;
      const rotated=options.map((_,k)=>options[(k+shift)%3]);
      return {prompt,options:rotated,correct:rotated.indexOf(correct),explanation:rule};
    });
    const phase=day<=15?"First Steps":day<=30?"Everyday Basics":day<=45?"Simple Tenses":day<=60?"English at Work":day<=75?"Messages and Conversations":"HR Interview Confidence";
    const typing=day>=76 && day%3===0 ? interviewAnswers[Math.floor((day-76)/3)%interviewAnswers.length] : null;
    return {day,title:`${title} · ${["Learn","Practise","Review"][round]}`,concept:title,rule,phase,questions,typing};
  });
}
const DAYS=buildDays();
module.exports={DAYS};
