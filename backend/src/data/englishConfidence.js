// English Confidence Builder - 90 days, 30 generated practice items daily.
// Template-generated practice content; not 2,700 independently authored MCQs.
const topics = [
  ['Am / Is / Are','Use am with I, is with he/she/it, and are with you/we/they.',[['I','am','is','are'],['She','is','am','are'],['They','are','is','am']]],
  ['Have / Has','Use have with I/you/we/they and has with he/she/it.',[['I','have','has','having'],['He','has','have','having'],['We','have','has','having']]],
  ['Do / Does','Use do with I/you/we/they and does with he/she/it.',[['you','do','does','did'],['she','does','do','did'],['they','do','does','did']]],
  ['Can / Cannot','Use can for ability and cannot for inability.',[['I','can','has','am'],['We','can','is','has'],['They','can','does','are']]],
  ['A / An','Use an before a vowel sound; a before a consonant sound.',[['engineer','an','a','the'],['designer','a','an','are'],['operator','an','a','is']]],
  ['This / These','This is singular; these is plural.',[['part','This','These','Those'],['parts','These','This','That'],['drawing','This','These','Those']]],
  ['That / Those','That is singular; those is plural.',[['machine','That','Those','These'],['machines','Those','That','This'],['vehicle','That','Those','These']]],
  ['There is / There are','There is for singular; there are for plural.',[['one model','is','are','am'],['two models','are','is','am'],['a problem','is','are','am']]],
  ['Present Simple','Use present simple for habits and routines.',[['I','work','works','working'],['She','works','work','working'],['They','work','works','working']]],
  ['Present Continuous','Use am/is/are plus -ing for actions happening now.',[['I am','working','work','worked'],['She is','designing','design','designed'],['They are','learning','learn','learned']]],
  ['Simple Past','Use past tense for completed actions.',[['I','worked','work','working'],['He','checked','check','checking'],['We','finished','finish','finishing']]],
  ['Simple Future','Use will followed by the base verb.',[['I will','work','worked','working'],['She will','join','joined','joining'],['They will','attend','attended','attending']]],
  ['Present Perfect','Use have/has plus past participle.',[['I have','completed','complete','completing'],['She has','submitted','submit','submitting'],['We have','checked','check','checking']]],
  ['In / On / At','Use in for cities, on for days, and at for clock times.',[['Pune','in','on','at'],['Monday','on','in','at'],['10 AM','at','on','in']]],
  ['What / Where / When','What asks for information, where for place, when for time.',[['your name','What','Where','When'],['the office','Where','What','When'],['the interview time','When','Where','What']]],
  ['Who / Why / How','Who asks about people, why about reasons, how about methods.',[['the trainer','Who','Why','How'],['the reason','Why','Who','How'],['the method','How','Who','Why']]],
  ['And / But / Because','And adds, but contrasts, because explains a reason.',[['adds information','and','but','because'],['shows contrast','but','and','because'],['gives a reason','because','and','but']]],
  ['Should / Must','Should gives advice; must states a requirement.',[['advice','should','must','was'],['requirement','must','should','did'],['recommendation','should','must','had']]],
  ['Could / Would','Could and would make requests polite.',[['Could you help me?','Could','Has','Does'],['Would you explain?','Would','Have','Did'],['Could you repeat?','Could','Has','Are']]],
  ['Comparisons','Use -er or more for comparisons.',[['good','better','gooder','bestest'],['large','larger','largeer','most large'],['small','smaller','smallestest','more small']]],
  ['Work Instructions','Use a base verb to give a direct instruction.',[['the drawing','Open','Opening','Opened'],['the dimensions','Check','Checking','Checked'],['the file','Save','Saving','Saved']]],
  ['Work Updates','Use past participles for finished work.',[['the model','completed','complete','completing'],['the drawing','reviewed','review','reviewing'],['the report','updated','update','updating']]],
  ['Asking for Help','Use polite language when asking questions.',[['you explain this?','Could','Has','Did'],['I ask a question?','May','Has','Did'],['you review this?','Can','Is','Has']]],
  ['Professional Messages','Use clear and polite expressions.',[['share the file','Please','Yesterday','Because'],['confirm the time','Kindly','Already','Never'],['for your help','Thank you','Was','Had']]],
  ['Email Writing','Use professional email vocabulary.',[['resume included with email','attached','detached','attachingly'],['email heading','subject','object','topicly'],['polite closing','regards','regardingly','regardness']]],
  ['CAD Vocabulary','Use correct mechanical design terms.',[['3D representation','model','invoice','salary'],['2D technical document','drawing','holiday','meeting'],['joined components','assembly','application','attendance']]],
  ['Project Explanation','Explain your own contribution using action verbs.',[['a door trim','designed','designing is','designs was'],['the dimensions','checked','checking is','checks was'],['the model','created','creating is','creates was']]],
  ['Self Introduction','Introduce education, skills, and interests.',[['completed degree','graduate','graduationing','graduately'],['software skill','CATIA','lunch','holiday'],['career interest','automotive design','sleep','weather']]],
  ['HR Interview','Answer questions clearly and honestly.',[['positive quality','strength','weakeningly','strengthen is'],['career target','goal','goaling','goaled'],['past work','experience','experiencingly','experiences is']]],
  ['Professional Confidence','Use positive and respectful workplace language.',[['to learn','ready','readinessly','reading is'],['for interview','available','availabilityly','avail'],['for the opportunity','thankful','thanking is','thankfully is']]]
];
const phases=['First Steps','Everyday Basics','Simple Tenses','English at Work','Messages and Conversations','HR Interview Confidence'];
const contexts=['in class','at work','during training','in a team meeting','in a CAD assignment','at an interview','in the office','in a project review','with your trainer','during practice'];
const DAYS=Array.from({length:90},(_,i)=>{
  const day=i+1, topic=topics[Math.floor(i/3)], round=i%3;
  const questions=Array.from({length:30},(_,j)=>{
    const [subject,correct,wrong1,wrong2]=topic[2][j%3];
    const options=[correct,wrong1,wrong2];
    const shift=(i+j)%3;
    const rotated=options.map((_,k)=>options[(k+shift)%3]);
    return {prompt:`${topic[0]}: Choose the correct word for "${subject}" (${contexts[Math.floor(j/3)]}).`,options:rotated,correct:rotated.indexOf(correct),explanation:topic[1]};
  });
  return {day,title:`${topic[0]} · ${['Learn','Practise','Review'][round]}`,concept:topic[0],rule:topic[1],phase:phases[Math.floor(i/15)],questions,typing:null};
});
module.exports={DAYS};
