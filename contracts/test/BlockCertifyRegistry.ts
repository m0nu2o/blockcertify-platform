
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('BlockCertifyRegistry', function () {
  it('issues, updates, verifies without a transaction, and revokes certificates', async function () {
    const [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('BlockCertifyRegistry');
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    await contract.issueCertificate('BC-123', 'meta-hash', 'file-hash', 'ipfs://metadata');
    const record = await contract.getCertificate('BC-123');
    expect(record.certificateId).to.equal('BC-123');
    expect(record.fileHash).to.equal('file-hash');

    await contract.updateCertificate('BC-123', 'meta-hash-2', 'ipfs://metadata-2');
    const updated = await contract.getCertificate('BC-123');
    expect(updated.metadataHash).to.equal('meta-hash-2');

    const nonceBefore = await owner.getNonce();
    const verified = await contract.verifyCertificate('BC-123');
    const nonceAfter = await owner.getNonce();

    expect(verified).to.equal(true);
    expect(nonceAfter).to.equal(nonceBefore);

    await contract.revokeCertificate('BC-123', 'Academic misconduct');
    const revoked = await contract.getCertificate('BC-123');
    expect(revoked.revoked).to.equal(true);
    expect(revoked.reason).to.equal('Academic misconduct');
    expect(revoked.issuer).to.equal(owner.address);
  });
});
