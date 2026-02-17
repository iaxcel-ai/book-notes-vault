export function compileRegex(input){
try{
return new RegExp(input,'i');
}catch{
return null;
}
}

export function highlight(text,re){
if(!re) return text;
return text.replace(re,m=>`<mark>${m}</mark>`);
}
