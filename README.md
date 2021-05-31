## Simple Vehicle Management sample

1. Implemented using existing fabcar samples from Hyperledger Fabric git repository with my own customization logic. 
2. Created a single channel, two organizations, a single orderer with each organization having a single peer.  
3. Each organization implemented with own Fabric CA standard of X509 certificates.
4. Developed fast and efficient chaincode written in Go and Javascript to manipulate, format client data, and then store it in the ledger. 
5. Used the internal CouchDB database for world state which allows for quick data retrieval and operation.
6. Utilized implicit private data collection model which is used to see data by organization level. 
7. Improved performance by integrating Hyperledger Explore which provides necessary network information of the blockchain and also integrated Hyperledger Caliper benchmark tool which allows users to measure the performance of a blockchain network with predefined use cases.
8. Created Rest API routes by using NodeJs server which will invoke and query data from the fabric network.
9. Node js application having the functionality of enrolling admin and registering user, invoke and query data from chaincode by using fabric network.

