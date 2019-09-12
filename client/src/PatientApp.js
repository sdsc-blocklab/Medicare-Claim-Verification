import React, { Component } from "react";
import ClaimVerification from "./contracts/Organizations.json"
import getWeb3 from "./utils/getWeb3";
import ServiceCell from './components/ServiceCell'
import { Card, CardBody } from 'reactstrap';
import ReactDOM from "react-dom"
import $ from 'jquery'

import "./ProviderApp.css";

export class PatientApp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            web3: this.props.web3,
            accounts: this.props.accounts,
            contract: this.props.contract,
            unverifiedClaims: []
        };
        this.providerID = null
        this.unverifiedClaims = []
        this.verifiedClaims = []
        this.patientId = this.props.id
        // this.solidityData = this.props.sd;
        this.patientname = null;
        this.serviceClaimID = null;
        this.updatePatientName = this.updatePatientName.bind(this);
        this.getClaims = this.getClaims.bind(this)
        this.getUnverifiedClaims = this.getUnverifiedClaims.bind(this)
        // this.provideService = this.provideService.bind(this);
        // this.fileClaim = this.fileClaim.bind(this);
    }

    notification_patientCellCreated(patientname) {
        $.ajax({
            url: 'http://localhost:4000/patientCellCreated',
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            crossDomain: true,
            dataType: 'json',
            xhrFields: { withCredentials: true },
            data: {
                patientname
            },
            success: (data) => {
                if (data.message === 'OK') {
                    console.log('Success sending email')
                }
                else {
                    console.log('ERROR sending email');
                }
            }
        });
    }

    notification_claimAdded(patientname, serviceID, service, amount) {
        $.ajax({
            url: 'http://localhost:4000/claimAdded',
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            crossDomain: true,
            dataType: 'json',
            xhrFields: { withCredentials: true },
            data: {
                patientname,
                serviceID,
                service,
                amount
            },
            success: (data) => {
                if (data.message === 'OK') {
                    console.log('Success sending email')
                }
                else {
                    console.log('ERROR sending email');
                }
            }
        });
    }

    notification_serviceClaimCreated(patientname, serviceID, service) {
        $.ajax({
            url: 'http://localhost:4000/serviceClaimCreated',
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            crossDomain: true,
            dataType: 'json',
            xhrFields: { withCredentials: true },
            data: {
                patientname,
                serviceID,
                service
            },
            success: (data) => {
                if (data.message === 'OK') {
                    console.log('Success sending email')
                }
                else {
                    console.log('ERROR sending email');
                }
            }
        });
    }

    updatePatientName({ target }) {
        this.patientname = target.value
    }

    componentDidMount = async () => {
        console.log(this.patientId)
        this.getUnverifiedClaims(this.patientId);
        var _ = this;
        setInterval(function () {
            _.getUnverifiedClaims(_.patientId);
        }, 10000);
    };

    getClaims = async (id) => {
        const { accounts, contract } = this.state;
        const unverifiedClaims = await contract.methods.patientUnverifiedClaims(id).send({ from: accounts[0] });
        this.unverifiedClaims = unverifiedClaims;
        console.log('unv', this.unverifiedClaims)
        const verifiedClaims = await contract.methods.patientVerifiedClaims(id).send({ from: accounts[0] });
        this.verifiedClaims = verifiedClaims;
        console.log('ver', this.verifiedClaims)
    }

    getUnverifiedClaims = async (id) => {
        const { accounts, contract } = this.state;
        var list = []
        const unv = await contract.methods.patientUnverifiedClaims(id).send({ from: accounts[0] });
        console.log('unv', unv.events)
        if (unv.events.SCName) {
            if (!unv.events.SCName.length) {
                list.push([unv.events.SCName.returnValues.name, unv.events.serviceList.returnValues.services[0]])
            }
            else {
                for (let i = 0; i < unv.events.SCName.length; i++) {
                    list.push([unv.events.SCName[i].returnValues.name, unv.events.serviceList.returnValues.services[i]])
                }
            }
            this.setState({ unverifiedClaims: list })
        }
        console.log("state of unv", this.state.unverifiedClaims)
    }

    verifyClaim = async (serviceClaimID) => {
        const { accounts, contract } = this.state;
        const info = await contract.methods.verifyClaim(serviceClaimID).send({ from: accounts[0] });
        console.log(info);
        this.getUnverifiedClaims(this.patientId);
    }

    render() {
        // let sd = this.solidityData
        // console.log("Rendering PatientApp ", sd)
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }
        return (
            <div>
                <h1 id='centerText'>Patient Dashboard</h1>

                <ul>
                    {
                        this.state.unverifiedClaims &&
                            this.state.unverifiedClaims.length > 0 ?
                            this.state.unverifiedClaims.map((output, i) => {
                                console.log(output)
                                return <ServiceCell
                                    // sd={sd}
                                    contract={this.state.contract}
                                    accounts={this.state.accounts}
                                    serviceName={output[0]}
                                    serviceAddr={output[1]}
                                    verifyClaim={this.verifyClaim}
                                />
                            }) : 
                            <Card body outline color="primary">
                                <CardBody>
                                    You do not have any unverified claims yet.
                                </CardBody>
                            </Card>
                    }
                </ul>
            </div>
        );
    }
}

export default PatientApp;
