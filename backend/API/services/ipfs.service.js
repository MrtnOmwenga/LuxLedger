import { createHelia } from 'helia';
import { json } from '@helia/json';

const toIPFS = async (jsonObject) => {
  const helia = await createHelia();
  const IPFS = json(helia);

  const address = await IPFS.add(jsonObject);
  return address.toString();
}

export default toIPFS;