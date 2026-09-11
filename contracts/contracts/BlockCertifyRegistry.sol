
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BlockCertifyRegistry {
    struct CertificateRecord {
        string certificateId;
        string metadataHash;
        string fileHash;
        string metadataUri;
        bool revoked;
        uint256 issuedAt;
        uint256 updatedAt;
        address issuer;
        string reason;
    }

    mapping(string => CertificateRecord) private certificates;
    mapping(address => bool) public authorizedIssuers;
    address public owner;

    event CertificateIssued(string indexed certificateId, string metadataHash, string fileHash, string metadataUri, address indexed issuer);
    event CertificateRevoked(string indexed certificateId, string reason, address indexed revoker);
    event CertificateUpdated(string indexed certificateId, string metadataHash, string metadataUri, address indexed updater);
    event IssuerAuthorizationUpdated(address indexed issuer, bool allowed);

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not owner');
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(msg.sender == owner || authorizedIssuers[msg.sender], 'Not authorized');
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    function setIssuerAuthorization(address issuer, bool allowed) external onlyOwner {
        authorizedIssuers[issuer] = allowed;
        emit IssuerAuthorizationUpdated(issuer, allowed);
    }

    function issueCertificate(string calldata certificateId, string calldata metadataHash, string calldata fileHash, string calldata metadataUri) external onlyAuthorizedIssuer {
        require(bytes(certificateId).length > 0, 'Invalid certificateId');
        require(certificates[certificateId].issuedAt == 0, 'Certificate exists');

        certificates[certificateId] = CertificateRecord({
            certificateId: certificateId,
            metadataHash: metadataHash,
            fileHash: fileHash,
            metadataUri: metadataUri,
            revoked: false,
            issuedAt: block.timestamp,
            updatedAt: block.timestamp,
            issuer: msg.sender,
            reason: ''
        });

        emit CertificateIssued(certificateId, metadataHash, fileHash, metadataUri, msg.sender);
    }

    function verifyCertificate(string calldata certificateId) external view returns (bool) {
        CertificateRecord memory record = certificates[certificateId];
        require(record.issuedAt != 0, 'Certificate missing');
        return !record.revoked;
    }

    function revokeCertificate(string calldata certificateId, string calldata reason) external onlyAuthorizedIssuer {
        CertificateRecord storage record = certificates[certificateId];
        require(record.issuedAt != 0, 'Certificate missing');
        require(!record.revoked, 'Already revoked');
        record.revoked = true;
        record.updatedAt = block.timestamp;
        record.reason = reason;
        emit CertificateRevoked(certificateId, reason, msg.sender);
    }

    function updateCertificate(string calldata certificateId, string calldata metadataHash, string calldata metadataUri) external onlyAuthorizedIssuer {
        CertificateRecord storage record = certificates[certificateId];
        require(record.issuedAt != 0, 'Certificate missing');
        require(!record.revoked, 'Revoked certificate');
        record.metadataHash = metadataHash;
        record.metadataUri = metadataUri;
        record.updatedAt = block.timestamp;
        emit CertificateUpdated(certificateId, metadataHash, metadataUri, msg.sender);
    }

    function getCertificate(string calldata certificateId) external view returns (CertificateRecord memory) {
        CertificateRecord memory record = certificates[certificateId];
        require(record.issuedAt != 0, 'Certificate missing');
        return record;
    }
}
