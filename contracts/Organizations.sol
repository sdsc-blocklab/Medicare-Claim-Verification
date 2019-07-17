pragma solidity ^0.5.0;

import "./SafeMath.sol";
import "./ServiceClaim.sol";

contract Organizations {

    uint256 claimId; //Max value of the number of claims made
    uint storedData; //Miscellaneous data

    mapping (bytes32=>Patient) patientMap; //ID of patient to specific provider - 
    mapping (bytes32=>Provider) providerMap; //ID of provider to specific provider -
    mapping (bytes32=>Insurer) insurerMap; //ID of insurance provider to specific insurer
    mapping (bytes32=>address) serviceClaimsMap; //ID of serviceClaim to the specific ServiceClaim contract instance

    //Events for organization creation
    event ClaimCreated(uint256 id, uint256 amount, uint256 service, bytes32 patient);
    event PatientCreated(bytes32 id, string name);
    event ProviderCreated(bytes32 id, string name);
    event InsurerCreated(bytes32 id, string name);

    struct Patient {
        bytes32 id;
        string name;
        address[] serviceClaimsList;
    }

    struct Provider {
        bytes32 id;
        string name;
        bytes32[] patients;
    }

    struct Insurer {
        bytes32 id;
        string name;
        bytes32[] providers;
    }

    // ------------------------------ Adds Users to Network --------------------------- //

    /** @dev add a patient to the network
    @param _name is the name of the patient
    @param _providerID is the current provider of the patient
    @return pID is a bytes32 represented id number for the patient
    */
    function addPatient(string memory _name, bytes32 _providerID) public returns(bytes32 pID) {
        bytes32 id = keccak256(abi.encodePacked(_name));
        address[] memory claimList;
        Patient memory newPatient = Patient(id, _name, claimList);
        //bytes32 patientHash = keccak256(abi.encodePacked(newPatient));
        patientMap[id] = newPatient;
        providerMap[_providerID].patients.push(newPatient.id);
        emit PatientCreated(id, _name);
        return id;
    }

    /** @dev add a provider to the network
    @param _name name of the provider
    @param _insurerID id of insurance provider
    @return the pID of the health provider -
     */
    function addProvider(string memory _name, bytes32 _insurerID) public returns(bytes32 pID) {
        bytes32 id = keccak256(abi.encodePacked(_name));
        bytes32[] memory emptyList;
        Provider memory newProvider = Provider(id, _name, emptyList);
        //bytes32 providerHash = keccak256(abi.encodePacked(newProvider));
        providerMap[id] = newProvider;
        insurerMap[_insurerID].providers.push(newProvider.id);
        emit ProviderCreated(id, _name);
        return id;
    }

    /** @dev add an insurnace provider to the network
    @param _name the name of the insurance provider
    @return the pID of the insurance provider
    */
    function addInsurer(string memory _name) public returns(bytes32 pID) {
        bytes32 id = keccak256(abi.encodePacked(_name));
        bytes32[] memory emptyList;
        Insurer memory newInsurer = Insurer(id, _name, emptyList);
        //bytes32 insurerHash = keccak256(abi.encodePacked(newInsurer));
        insurerMap[id] = newInsurer;
        emit InsurerCreated(id, _name);
        return id;
    }

    // ------------------------------ Functionality of the Network --------------------------- //

    /** @dev create an instance of a ServiceClaim contract
    @param _name name of the service
    @param _providerID provider ID
    @param _patientID patient ID
    @return serviceContractHash is the id of the ServiceClaim contract
    */
    function newServiceClaim(string memory _name, bytes32 _providerID, bytes32 _patientID) public returns(bytes32 serviceContractHash) {
        uint256 id = uint(keccak256(abi.encodePacked(_name)));
        ServiceClaim serviceClaim = new ServiceClaim(_providerID, _patientID, id, _name);
        bytes32 serviceClaimID = keccak256(abi.encodePacked(address(serviceClaim)));
        serviceClaimsMap[serviceClaimID] = address(serviceClaim);
        Patient storage patient = patientMap[_patientID];
        patient.serviceClaimsList.push(address(serviceClaim));
        return serviceClaimID;
    }

    /** @dev add a claim to a ServiceClaim contract i.e. the provider wants to file a claim for a service rendered
    @param _serviceClaimID the ID of the ServiceClaim contract
    @param _amount the amount to be claimed by the provider
    @param _service the service code provided
    @param _patient the patient id
    @return ClaimID the ID of the claim
    */
    function addClaim(bytes32 _serviceClaimID, uint256 _amount, uint256 _service, bytes32 _patient) public returns(uint256 ClaimID) {
        Patient storage cPatient = patientMap[_patient];
        ServiceClaim myServiceClaim = ServiceClaim(serviceClaimsMap[_serviceClaimID]);
        uint256 newClaimID = myServiceClaim.addClaim(claimId++,_amount);
        emit ClaimCreated(newClaimID, _amount, _service, _patient);
        return newClaimID;
    }

    /** @dev invoke the verifyClaim function in the ServiceClaim contract
    @param _serviceClaimID the id of the ServiceClaim contract
    */
    function verifyClaim(bytes32 _serviceClaimID) public {
        ServiceClaim myServiceClaim = ServiceClaim(serviceClaimsMap[_serviceClaimID]);
        myServiceClaim.verifyClaim();
        payProvider(myServiceClaim);
    }

    /** @dev invoke the payProvider function in the ServiceClaim contract, may only be called from within Organizations.sol
    @param _serviceClaim an instance of the ServiceClaim contract
    */
    function payProvider(ServiceClaim _serviceClaim) internal {
        //require(_serviceClaim.claim().verified == true, "User has not verified service");
        _serviceClaim.payProvider();
    }
    
}