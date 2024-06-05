import { LightningElement, track, api } from 'lwc';
// import mainFAQS from "@salesforce/apex/ChatBotController.fetchMainFAQS";
// import subFAQS from "@salesforce/apex/ChatBotController.fetchSubFAQS";
// import solFAQS from "@salesforce/apex/ChatBotController.fetchSolution";
import chatBot from "@salesforce/resourceUrl/chatBot";
import chatBotFAQs from '@salesforce/apex/ChatBotController.getFAQs';
import chatBotSubFAQs from '@salesforce/apex/ChatBotController.getSubFAQs';

export default class ChatBot extends LightningElement {
    @track popupOpen = false; //used to open chatbot im child component
    @track startchat = true;  //used to close chatbot in parent component
    @track issues = []; // options for user to select
    @track isSpinner = true; //used to track status of spinner
    isIssue = false; //used to track if any active issue is there
    isSol = false;  //used to track if any active solution is there
    isTimer = false; //used to track time
    isChatStarted = false;
    messages = [];  //used to store users selected option as message
    solution = ''; //used to display solution
    chatBot;
    time = [1000, 1200, 1400];
    faq;
    @track question = 'What seems to be causing you trouble?';

    connectedCallback(){
        this.chatBot = chatBot;
        this.isTimer = false;
        this.fetchingMainFAQS();
        chatBotFAQs()
        .then((result) =>{
            console.log(result);
            console.log('fetched new data');
        });
        chatBotSubFAQs({key:'Integration'})
        .then((result) =>{
            console.log(result);
        })
        .catch((error) =>{
            console.log(error);
        });
    }

    fetchingMainFAQS(){
        this.checkSpinnerDuration((result) => {
            if(result === 'success'){
                this.isTimer = true;
                console.log('Time completed');
                if(this.isTimer == true && this.issues != null){
                    this.isSpinner = false;
                    this.isIssue = true;
                }
            }
        });
        chatBotFAQs()
        .then((result) =>{
            if (result && result.length > 0) {
                this.issues = result;
                console.log('Fetched MainFAQS:', this.issues);
                if(this.isTimer == true && this.issues != null){
                    this.isSpinner = false;
                    this.isIssue = true;
                }
            } else {
                console.log('No MainFAQS found.');
            }
        });
    }

    fetchingSubFAQS(recid){
        console.log('this is recid'+recid);
        this.checkSpinnerDuration((result) => {
            if(result === 'success'){
                this.isTimer = true;
                console.log('Time completed');
                if(this.isTimer == true && (this.issues != null || this.solution != null)){
                    this.isSpinner = false;
                    if(this.issues != null){
                        this.isIssue = true;
                    }
                    if(this.solution != null){
                        this.isSol = true;
                    }
                }
            }
        });
        chatBotSubFAQs({key: recid})
        .then((result) =>{
            if (result && result.length > 0) {
                this.issues = result;
                if(this.isTimer == true && this.issues != null){
                    this.isSpinner = false;
                    this.isIssue = true;
    
                }
                console.log('Fetched subFAQS:', this.issues);
            } else {
                console.log('No subFAQS found.');
                this.fetchingSolFAQS(recid);
            }
        })
        .catch((error) =>{
            console.error('error fetching', error);
        });
    }

    fetchingSolFAQS(recid){
        console.log('this is recid inside solFAQS'+recid);
        solFAQS({recid: recid})
        .then((result) =>{
            console.log('this is result '+result[0]);
            if(!result[0].Solution__c){
                this.solution = 'No solution Found';
            }
            else{
                this.solution = result[0].Solution__c;
            }
            if(this.isTimer == true && this.solution != null){
                this.isSpinner = false;
                this.isSol = true;
            }
            console.log(this.solution);
        })
        .catch((error) =>{
            console.error('error fetching sol', error);
        });
    }

    get popupClass() {
        return this.popupOpen ? 'popupopen' : 'popup';
    }

    @api togglePopup() {
        this.popupOpen = true;
    }

    togglePopupClose(){
        console.log('closing');
        this.popupOpen = false;
        this.dispatchEvent(new CustomEvent('toggleclose', {
            detail: {
                message: this.startchat
            }
        }));
    }

    handleClick(event){      
        if(!this.isChatStarted){
            this.isChatStarted = true;
        }
        this.isIssue = false;
        this.isSol = false;
        this.isSpinner = true;
        this.isTimer = false;
        this.checkSpinnerDuration((result) => {
            console.log(result); // Will log 'success' after a random time
        });
        console.log(event.currentTarget.dataset.key);
        console.log(event.currentTarget.dataset.value);
        this.issues = null;
        // const paragraph = document.createElement('p');
        // paragraph.innerText = event.currentTarget.dataset.value;
        // paragraph.classList.add('right-message');
        // const messageContainer = this.template.querySelector('.message');
        // paragraph.style.float = 'right';
        // paragraph.style.width = '70%';
        // paragraph.style.wordWrap = 'break-word';
        // paragraph.style.backgroundColor = '#3c86e0';
        // // paragraph.style.boxShadow = '3px 3px 3px rgb(145, 145, 145)';
        // paragraph.style.color = 'white';
        // paragraph.style.padding = '10px';
        // paragraph.style.borderRadius = '5px';
        // paragraph.style.margin = '5px 0px';
        // messageContainer.appendChild(paragraph);
        this.messages.push(event.currentTarget.dataset.value);
        this.fetchingSubFAQS(event.currentTarget.dataset.key);

    }

    handleChat(){
        this.isSpinner = true;
        this.isIssue = false;
        this.isSol = false;
        this.issues = null;
        this.messages = [];
        this.solution = null;
        this.isChatStarted = false;
        this.connectedCallback();
    }

    getRandomTime(){
        const randomIndex = Math.floor(Math.random() * this.time.length);
        const randomTime = this.time[randomIndex];
        console.log(randomTime);
        return randomTime;
    }

    checkSpinnerDuration(callback){
        setTimeout(()=>{
            callback('success');
        }, this.getRandomTime());
    }

}