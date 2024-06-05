import { LightningElement, track , api} from 'lwc';
import getAllTemplates from '@salesforce/apex/GenerateCSVController.getAllTemplates';
import getTemplateData from '@salesforce/apex/GenerateCSVController.getTemplateData';

export default class GenerateCSV extends LightningElement {


    @track templateId;
    @api queryString;
    @track showSpinner = true;
    @track allTemplates;
    fetchedResults = [];
    @track showTemplateDetails = false;
    @track csvFileName = '';
    initialRender = true;

// -=-=- Used to fetch all the templates from the org Where template type is CSV -=-=-
    connectedCallback(){
        this.showModel = true;
        getAllTemplates()
        .then((data) => {
            this.allTemplates = data.map((template) => ({
                value: template.Id,
                label: template.Template_Name__c,
                descr : template.Description__c,
                objName : template.Object_API_Name__c,
            }));
            console.log('All Templates (value & label):', this.allTemplates[0].label);
            console.log('All Templates (value & label):', this.allTemplates[0].value);
            this.showSpinner = false;
        })
        .catch((err) => {
            this.showSpinner = false;
            console.error('Error fetching all the templates...', err.message);
            this.showToast('error', 'Oops! Update Template!', 'We couldn\'t fetch the templates for you!', 5000);
        });
    }

// -=-=- Used to override the styles of the standard salesforce Input fields and combo boxes (Only Once)-=-=-
    renderedCallback(){
        if(this.initialRender){
            // To OverRider standard slds css properties...
            var mainFilterDiv = this.template.querySelector('.main-div');
            var styleEle = document.createElement('style');
            styleEle.innerText = `
                        .slds-input, .fix-slds-input_faux{
                            height: 50px;
                            border-radius: 8px;
                        }
                        .slds-input:focus, .slds-combobox__input:focus{
                            border-color: #00aeff;
                            box-shadow: none;
                        }
                        .slds-form-element__label{
                            font-size: 13px;
                            color: #00AEFF;
                            padding: 0px 5px;
                            border-radius: 50%;
                            position: absolute;
                            z-index: 1;
                            background-color: white;
                            top: -10px;
                            left: 15px;
                        }
                        .fix-slds-input_faux{
                            display: flex;
                            align-items: center;
                        }

                        .slds-checkbox .slds-checkbox__label .slds-form-element__label {
                            position : static !important;
                        }
            `;
            if(mainFilterDiv){
                mainFilterDiv.appendChild(styleEle);
                this.initialRender = false;
            }

        }
    }

// -=-=- Used to handle the change of selected template -=-=-
    handleTemplateIdChange(event){
        this.templateId = event.target.value;
        console.log('This Template Id:: ' + this.templateId);
    }

// -=-=- Used to handle the change in checkbox for the additional details in the CSV -=-=-
    handleTemplateDetailsToggle(event){
        this.showTemplateDetails = event.target.checked;
        console.log('Show Template Details:: ' + this.showTemplateDetails);
    }

// -=-=- Used to handle the file name change -=-=-
    handleFileNameChange(event){
        this.csvFileName = event.target.value;
        console.log('CSV File Name:: ' + this.csvFileName);
    }

// -=-=- Used to fetch all the data related to a particular template like query, sessionId and selected fields  -=-=-
    async handleGenerateCSV() {
        this.showSpinner = true;
        if (!this.templateId) {
            this.showSpinner = false;
            this.showToast('error', 'Oops!, Missed to select Template!', 'Please select a template to generate CSV from.', 5000);
            return;
        }
        try {
            const data = await getTemplateData({ templateId: this.templateId });
            if(!data){
                this.showToast('error', 'Oops! Missed to Update Template? ', 'Please Update the Template fields and filters..', 5000);
                return ;
            }
            const [fieldNamesString, query, sessionId] = data.split(' <|QDG|> ');
            console.log('fieldNamesString ::: ' + fieldNamesString);
            console.log('Query ::: ' + query);
            console.log('sessionId ::: ' + sessionId);
            const fieldNames = fieldNamesString.split(',');
            // const totalRecordCount = parseInt(sessionId);
            const generationCount = parseInt(query.split('LIMIT ')[1]);
            let csvContent = '';
            if (this.showTemplateDetails) {
                const thisTemplate = this.allTemplates.find(opt => opt.value == this.templateId);
                thisTemplate.descr = thisTemplate.descr ? thisTemplate.descr : 'No Description Available for this template';
                csvContent += ' , Name : ,"' + thisTemplate.label + '"\n'
                    + ' , Description : ,"' + thisTemplate.descr + '"\n'
                    + ' , Object Api Name : ,' + thisTemplate.objName + '\n'
                    + ' , CSV Creation Time : , ' + new Date().toLocaleString().replace(',', ' ') + '\n' + '\n';
            }
            csvContent += fieldNames.join(',') + '\n';
            console.log('Content of CSV :: ' , csvContent);
            const newQuery = '/services/data/v59.0/query/?q=' + query.split('LIMIT')[0];
            console.log('Query :: ' , newQuery);

            const isSuccess = await this.fetchRecords(newQuery ,sessionId, generationCount);
            console.log('Fetched records in main :: ' + this.fetchedResults.length);
            if(isSuccess){
                if(this.fetchedResults.length == 0){
                    this.showToast('warning', 'Oops! No matching records Found!', 'Uh Oh!, Try changing the Filter criteria!!');
                }else{
                    for (const record of this.fetchedResults) {
                        const rowValues = fieldNames.map(fieldName => record[fieldName] ? `"${record[fieldName]}"` : '""');
                        csvContent += rowValues.join(',') + '\n';
                    }
                    this.downloadCSV(csvContent);
                    this.showSpinner = false;
                }
            }
        } catch (err) {
            this.showSpinner = false;
            this.showToast('error', 'Oops! Something went wrong', 'Some error occurred, Please try again.', 5000);
        }
    }

// -=-=- Used to call the SF API repeatedly until no of records reaches to the limit -=-=-
    async fetchRecords(queryURL, sessionId, limitOfRecords) {
        try{
            // console.log('Limit : ' + limitOfRecords);
            // console.log('Query  : ' + encodeURI(queryURL));
            const myHeaders = new Headers();
            let bearerString = "Bearer " + sessionId;
            myHeaders.append("Authorization", bearerString);
    
            const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
            };
            // console.log('URL : ' +window.location.origin );
            let domainURL = window.location.origin;
            domainURL = domainURL.replace('lightning.force.com', 'my.salesforce.com');
    
            const response = await fetch(encodeURI(domainURL+queryURL), requestOptions);
            if (!response.ok) {
                this.showToast('error', 'Oops! Something went wrong!' , 'There was an error connecting to the server, please try again.', 5000);
                return false;
            }
            const result = await response.json();
            let thisFetchedBatch = result.records;
            this.fetchedResults.push(...thisFetchedBatch);
            console.log('next record URL :: ' + result.nextRecordsUrl);
            if(result.nextRecordsUrl && limitOfRecords > this.fetchedResults.length){
                console.log('fetching more.');
                await this.fetchRecords(result.nextRecordsUrl,sessionId, limitOfRecords);
            }else if(limitOfRecords < this.fetchedResults.length){
                console.log('Slicing records.');
                this.fetchedResults = this.fetchedResults.slice(0, limitOfRecords);

            }else{
                console.log('Fetched records are ::: '+ this.fetchedResults.length);
            }
            return true;
        } catch(error){
            this.showToast('error', 'Sorry, The records could not be fetched!', 'We couldn\'t fetch the records, please try again..');
            console.log('Error fetching records : ' + error.message);
            return false;
        }
    }

// -=-=- Used to download the Generated CSV in the local system -=-=-
    downloadCSV(csvContent) {
        this.showSpinner = true;
        try{
            this.fetchedResults = [];
            console.log('In CSV Download!!');
            if(!this.csvFileName){
                let thisTemplate = this.allTemplates.find(opt => opt.value == this.templateId);
                this.csvFileName = thisTemplate.label;
                // console.log('Updated the CSV Name to :: ' + this.csvFileName);
            }
            var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
            let downloadElement = document.createElement('a');
            downloadElement.href = element;
            downloadElement.target = '_self';
            console.log('What is file Name ???:: ' + this.csvFileName);
            downloadElement.download = this.csvFileName+'.csv';
            document.body.appendChild(downloadElement);
            downloadElement.click();
            this.showSpinner = false;
            this.showToast('success', 'Woohoo! Action performed!', 'Your CSV is Downloaded Successfully.', 5000 );
        }catch(err){
            this.showSpinner = false;
            this.showToast('error', 'Oops! Something went wrong', 'We Couldn\'t generate CSV at the moment!, please try again..', 5000);
            console.log('Error in Generating CSV!!' , err.message);
        }
    }

// -=-=- Used to show the toast to the User -=-=-
    showToast(status, title, message, duration){
        this.showSpinner = false;
        const messageContainer = this.template.querySelector('c-message-popup')
        messageContainer.showMessageToast({
            status: status,
            title: title,
            message : message,
            duration : duration
        });
    }

}