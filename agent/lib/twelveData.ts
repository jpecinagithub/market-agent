export async function fetchCompanyValue(empresa: string){
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  const url = `https://api.twelvedata.com/time_series?apikey=${apiKey}&symbol=${empresa}&interval=1min`
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching company value: ${response.statusText}`);
  } 
  const data = await response.json();
  return data;

}



