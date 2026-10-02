
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

  it('reports version and prevents duplicate issuance and unauthorized revocation', async function () {
    const [owner, issuerA, issuerB, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('BlockCertifyRegistry');
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    expect(await contract.VERSION()).to.equal('1.1.0');

    // Authorize issuerA and issuerB
    await expect(contract.connect(owner).setIssuerAuthorization(issuerA.address, true))
      .to.emit(contract, 'IssuerAuthorized')
      .withArgs(issuerA.address);

    await contract.connect(owner).setIssuerAuthorization(issuerB.address, true);

    // Stranger cannot issue
    await expect(
      contract.connect(stranger).issueCertificate('BC-STRANGER', 'hash', 'hash', 'ipfs://')
    ).to.be.revertedWith('Not authorized');

    // issuerA issues certificate
    await contract.connect(issuerA).issueCertificate('BC-200', 'meta-1', 'file-1', 'ipfs://meta-1');

    // Duplicate certificate rejected
    await expect(
      contract.connect(issuerA).issueCertificate('BC-200', 'meta-2', 'file-2', 'ipfs://meta-2')
    ).to.be.revertedWith('Certificate exists');

    // issuerB cannot revoke issuerA's certificate
    await expect(
      contract.connect(issuerB).revokeCertificate('BC-200', 'Fraud')
    ).to.be.revertedWith('Not certificate issuer');

    // issuerA can revoke their own certificate
    await contract.connect(issuerA).revokeCertificate('BC-200', 'Cancelled');
    const record = await contract.getCertificate('BC-200');
    expect(record.revoked).to.equal(true);
    expect(record.reason).to.equal('Cancelled');
  });
});
