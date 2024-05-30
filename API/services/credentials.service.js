import crypto from 'crypto';
import { ceramic, did } from '../services/ceramic.service.js';

export const issueVerifiableCredential = async (documentId, credentialData) => {
  try {
    const credential = {
      id: `${did.id}#${documentId}`,
      type: ['VerifiableCredential', 'UserProfileCredential'],
      issuer: did.id,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      credentialSubject: {
        id: documentId,
        walletAddress: credentialData.walletAddress,
        password: credentialData.password
      }
    };

    const signedCredential = await signCredential(credential);

    return signedCredential;
  } catch (error) {
    console.error('Error issuing verifiable credential:', error);
    throw new Error('Failed to issue verifiable credential');
  }
};

const signCredential = async (credential) => {
  try {
    const serializedCredential = JSON.stringify(credential);
    const keyPair = await ceramic.keyDidGenerate('ed25519');
    const privateKey = keyPair.privateKey;

    const signer = crypto.createSign('sha256');
    signer.update(serializedCredential);
    const signature = signer.sign(privateKey, 'base64');

    return { ...credential, proof: { signature, publicKey: keyPair.publicKey } };
  } catch (error) {
    console.error('Error signing credential:', error);
    throw new Error('Failed to sign credential');
  }
};

export const verifyCredential = async (credential) => {
  try {
    const isValidSignature = await validateSignature(credential);
    const isTrustedIssuer = await verifyIssuer(credential.issuer);
    const isNotExpired = isCredentialNotExpired(credential.expirationDate);
    // const isNotRevoked = await isCredentialNotRevoked(credential.id);

    return isValidSignature && isTrustedIssuer && isNotExpired; // Remove isNotRevoked for now
  } catch (error) {
    console.error('Error verifying verifiable credential:', error);
    return false;
  }
};

const validateSignature = async (credential) => {
  try {
    const { proof, ...payload } = credential;
    const { signature, publicKey } = proof;

    const serializedPayload = JSON.stringify(payload);
    const verifier = crypto.createVerify('sha256');
    verifier.update(serializedPayload);

    const isValidSignature = verifier.verify(publicKey, signature, 'base64');

    return isValidSignature;
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
};

const verifyIssuer = async (issuer) => {
  try {
    const trustedIssuers = [did.id];
    const isTrusted = trustedIssuers.includes(issuer);

    return isTrusted;
  } catch (error) {
    console.error('Error verifying issuer:', error);
    return false;
  }
};

const isCredentialNotExpired = (expirationDate) => {
  try {
    const expiration = new Date(expirationDate);
    const currentDate = new Date();

    const isValid = expiration > currentDate;

    return isValid;
  } catch (error) {
    console.error('Error checking credential expiration:', error);
    return false;
  }
};

// Placeholder implementation for revocation check
// Replace with actual implementation if needed
const isCredentialNotRevoked = async (credentialId) => {
  try {
    return true; // Placeholder: Always return true for now
  } catch (error) {
    console.error('Error checking credential revocation:', error);
    return false;
  }
};
