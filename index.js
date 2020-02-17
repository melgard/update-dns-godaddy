const fs = require('fs');
const axios = require('axios').default;
const domain = 'tudominio.com';
const text = fs.readFileSync('./records.txt', 'utf8');

const GODADDY_KEY = process.GODADDY_KEY;
const GODADDY_SECRET = process.GODADDY_SECRET;


const getHeaders = () => ({ Authorization: `sso-key ${GODADDY_KEY}:${GODADDY_SECRET}` });

const getRecordsFromGodaddy = (domain) => new Promise(async (resolve, reject) => {
  const url = `https://api.godaddy.com/v1/domains/${domain}/records/TXT`;
  const axiosOpts = {
    url,
    method: 'get',
    headers: getHeaders()
  };
  try {
    const resp = await axios(axiosOpts);
    return resolve(resp.data.filter(record => !record.name.includes('_acme-challenge')));
  } catch (e) {
    console.error(e);
  }

});

const getRecordsFromText = (domain, text) => {
  return text.split('\n')
    .map(item => {
      const [name, data] = item.split('\t');
      const nameWithoutDomain = name.replace(`.${domain}`, '');
      return {
        data,
        name: nameWithoutDomain,
        ttl: 600,
        type: 'TXT'
      }
    });
};

const createOrUpdateDNS = async (domain, records) => {
  const url = `https://api.godaddy.com/v1/domains/${domain}/records/TXT`;
  const axiosOpts = {
    url,
    method: 'put',
    data: records,
    headers: getHeaders()
  };
  try {
    await axios(axiosOpts);
  } catch (e) {
    console.error(e);
  }
};

async function main(domain, text) {
  let currentRecords = await getRecordsFromGodaddy(domain);
  const newRecords = getRecordsFromText(domain, text);
  const toSave = [...newRecords, ...currentRecords];
  try {
    await createOrUpdateDNS(domain, toSave);
    console.log('Ha finalizado con éxito');
  } catch (e) {
    console.error('Ocurrió un error al crear los records.');
  }
}

main(domain, text);
