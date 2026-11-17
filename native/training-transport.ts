const api=import.meta.env.VITE_NATIVE_API_ORIGIN ?? 'https://ortak-oyuncu.lovable.app';
function call(action:string) {
  return async ({data}:{data:unknown}):Promise<any> => {
    const response=await fetch(`${api}/api/public/game`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,data}),credentials:'omit'});
    const body=await response.json();
    if(!response.ok || body.error) throw new Error(body.error??'Bağlantı kurulamadı');
    return body.result;
  };
}
export const startTraining=call('startTraining'),checkTraining=call('checkTraining');
