import { LightningElement, api, track } from 'lwc';
import getTemplate from '@salesforce/apex/EditDragDropTemplateController.getTemplate';
import getObjectSelectField from '@salesforce/apex/EditDragDropTemplateController.getObjectSelectField';
import saveFields from '@salesforce/apex/EditDragDropTemplateController.saveFields';
import getFields from '@salesforce/apex/EditDragDropTemplateController.getFields';


export default class EditDragDropTemplate extends LightningElement {
    @api templateId;
    @track isSpinner = true;
    @track templateName;
    @track templateRow;
    @track templateColumns;
    @track templateObject;
    @track rows = [];
    @track columns = [];
    @track fieldLable = [];
    @track templateFields = [];
    @track fields = [];
    @track templatedata = [];
    @track draggedFieldName;

    connectedCallback() {
        try {
            this.isSpinner = true;
            getTemplate({ templateId: this.templateId })
                .then((data) => {
                    if (data) {
                        this.templateName = data[0].Template_Name__c;
                        this.templateRow = data[0].Row__c;
                        this.templateColumns = data[0].Column__c;
                        this.templateObject = data[0].Object_API_Name__c;
                        this.baseOngetField();
                        this.getTemplateField();
                        // this.setTemplateData();
                        // this.isSpinner = false;
                    } else {
                        this.isSpinner = false;
                        console.error('Error fetching template data');
                    }
                })
                .catch(error => {
                    this.isSpinner = false;
                    console.error('Error fetching template:', error);
                });
                // this.isSpinner = false;
        } catch (error) {
            console.log('Error connectedCallback :' + error.message);
        }
        
    }

    baseOngetField() {
        try {
            this.isSpinner = true;
            getObjectSelectField({ ObjectName: this.templateObject })
                .then(result => {
                    console.log("result *** : ",result);
                    this.fieldLable = result.pairWrapperList;
                    this.isSpinner = false;
                }).catch(error => {
                    this.isSpinner = false;
                    console.error('Error fetching object fields:', error);
                });
        } catch (error) {
            console.log('Error baseOngetField :' + error.message);
        }
    }

    getTemplateField() {
        try {
            this.isSpinner = true;
            getFields({ templateId: this.templateId })
                .then(result => {
                    console.log("result field list *** : ",result);
                    this.templateFields = result;
                    this.setTemplateData();
                    this.isSpinner = false;
                }).catch(error => {
                    this.isSpinner = false;
                    console.error('Error getFields:', error);
                });
        } catch (error) {
            console.log('Error getTemplateField :' + error.message);
        }
    }

    setTemplateData() {
        try {
            this.isSpinner = true;
            for (let i = 1; i <= this.templateRow; i++) {
                this.columns = [];
                for (let j = 1; j <= this.templateColumns; j++) {
                    this.columns.push({ columnId: j, columnName: 'columnBox' + j, fields: [] });
                }
                this.templatedata.push({rowId: i, rowName: 'Row' + i, columns:  this.columns})
            }
            console.log('this.templatedata *** : ',this.templatedata);
            console.log('this.templatedata *** : ',JSON.stringify(this.templatedata));
            this.templateFields.forEach(element => {
                let sequenceNumber = element.Sequence_Number_D_D__c;
                let sequenceNumberList = [];
                if (sequenceNumber != null && sequenceNumber != undefined && sequenceNumber != '') {
                    sequenceNumberList = sequenceNumber.split('<!DG*)>');
                }
                let columnNum = sequenceNumberList[1];
                let rowNum = sequenceNumberList[0];
                // let columnNum = element.Sequence_Number_D_D__c;
                // let rowNum = element.Sr_Number_D_D__c;
                if (columnNum != undefined && rowNum != undefined) {
                    console.log('u r in the if con');
                    const row = this.templatedata.find(row => row.rowId == rowNum);
                    const column = row.columns.find(column => column.columnId == columnNum);
                    column.fields.push({ fieldId: element.id ,fieldSrNo: element.Sr_Number_D_D__c, api: element.Field_API_Name_D_D__c, label:element.Field_Label_D_D__c});
                    column.fields.sort((a, b) => parseInt(a.fieldSrNo) - parseInt(b.fieldSrNo));
                }
                // let temFieldsList = column.fields;
                // column.fields = temFieldsList.sort(
                //     (p1, p2) => (p1.fieldSrNo < p2.fieldSrNo) ? 1 : (p1.fieldSrNo > p2.fieldSrNo) ? -1 : 0);
            });
            
            console.log('this.templatedata 222 *** : ',JSON.stringify(this.templatedata));
            // this.templatedata.forEach(element => {
                
            // });
            this.isSpinner = false;
        } catch (error) {
            console.log('Error setTemplateData :' + error.message);
        }
        
    }

    taskDragStart(event) {
        try {
            // this.isSpinner = true;
            event.dataTransfer.setData('text/plain', event.target.dataset.name);
            event.dataTransfer.setData('fieldLabel', event.target.dataset.id);
        } catch (error) {
            this.isSpinner = false;
            console.log('Error taskDragStart :' + error.message);
        }
    }

    allowDrop(event) {
        try {
            // this.isSpinner = true;
            event.preventDefault();
        } catch (error) {
            this.isSpinner = false;
            console.log('Error allowDrop :' + error.message);
        }
    }

    taskDrop(event) {
        try {
            this.isSpinner = true;
            console.log('Dropping...'); // Log the "Dropping..." message
            event.preventDefault();
            const fieldName = event.dataTransfer.getData('fieldLabel');
            console.log("fieldName *** : ",fieldName);
            const fieldAPI = event.dataTransfer.getData('text/plain');
            console.log("fieldAPI *** : ",fieldAPI);
            const rowId = event.target.dataset.name; // Use dataset to get the data-name attribute
            console.log("rowId *** : ",rowId);
            const columnId = event.target.dataset.id; // Use dataset to get the data-id attribute
            console.log("columnId *** : ",columnId);
            const sectionNo = rowId + '<!DG*)>' + columnId;
            let srNo = '';
            if (fieldName != null && fieldName != undefined && fieldAPI != null && fieldAPI != undefined &&  rowId != null && rowId != undefined &&  columnId != null && columnId != undefined) {
                const row = this.templatedata.find(row => row.rowId == rowId);
                const column = row.columns.find(column => column.columnId == columnId);
                console.log('column.fields : ',JSON.stringify(column.fields));
                const fieldsList = column.fields;
                console.log('fieldsList.length: ',fieldsList.length);
                if (fieldsList.length != null && fieldsList.length  != undefined) {
                    var srqw = fieldsList.length+1;
                    srNo = srqw;
                    column.fields.push({ api: fieldAPI, label:fieldName, srNo: srNo});
                }
                this.feildSave(fieldName,fieldAPI,srNo,sectionNo);
            }else{
                this.isSpinner = false;
                this.showMessageToast('error', '', 'Please Drop again', 4000);
                console.log('Please Drop again');
                this.isSpinner = false;
            }
           
        } catch (error) {
            this.isSpinner = false;
            console.log('Error taskDrop :' + error.message);
        }
    }
    
    taskDragEnd(event) {
        try {
            this.isSpinner = true;
            const fieldName = event.target.dataset.name;
            this.draggedFieldName = fieldName;
            // console.log("Field Api name *** : ",fieldName);
            this.isSpinner = false;
        } catch (error) {
            this.isSpinner = false;
            console.log('Error taskDragEnd :' + error.message);
        }
    }

    handleCancel(){
        try {
            const closeModalEvent = new CustomEvent('closemodal');
            this.dispatchEvent(closeModalEvent);
        } catch (error) {
            console.log('Error handleCancel :' + error.message);
        }
    }

    feildSave(fieldName,fieldAPI,srNo,sectionNo){
        this.isSpinner = true;
        saveFields({ templateId: this.templateId, fieldName: fieldName, fieldAPI: fieldAPI, srNumber:srNo, sequenceNumber:sectionNo})
        .then(result => {
            console.log("result in save method *** : ",result);
            if (result == 'success') {
                // const row = this.templatedata.find(row => row.id == rowId);
                // const column = row.columns.find(column => column.id == columnId);
                let sequenceNumberList = [];
                if (sectionNo != null && sectionNo != undefined && sectionNo != '') {
                    sequenceNumberList = sectionNo.split('<!DG*)>');
                }
                let columnNum = sequenceNumberList[1];
                let rowNum = sequenceNumberList[0];
                const row = this.templatedata.find(row => row.rowId == rowNum);
                const column = row.columns.find(column => column.columnId == columnNum);
                // column.fields.push({ api: fieldAPI, label:fieldName, srNo: srNo});
                this.isSpinner = false;
            }
        }).catch(error => {
            this.isSpinner = false;
            console.error('Error saveFields:', error.message);
        });
    }

    // ==== ===== ==== Generetic Method to test Message Popup and Toast... === === === === === === ===
    showMessagePopup(Status, Title, Message){
        const messageContainer = this.template.querySelector('c-message-popup')
        if(messageContainer){
            messageContainer.showMessagePopup({
                status: Status,
                title: Title,
                message : Message,
            });
        }
    }

    showMessageToast(Status, Title, Message, Duration){
        const messageContainer = this.template.querySelector('c-message-popup')
        if(messageContainer){
            messageContainer.showMessageToast({
                status: Status,
                title: Title,
                message : Message,
                duration : Duration
            });
        }
    }
}