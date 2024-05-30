import CeramicClient from '@ceramicnetwork/http-client';
import config from '../utils/config.utils';

const ceramic = new CeramicClient(config.CERAMIC_NODE_URL);
const { did } = await ceramic.createDID();

export { ceramic, did };
