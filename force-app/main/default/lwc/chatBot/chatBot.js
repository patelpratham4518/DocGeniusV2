import { LightningElement, track } from 'lwc';
import Feedback from "@salesforce/resourceUrl/Feedback";
// import mainFAQS from "@salesforce/apex/ChatBotController.fetchMainFAQS";
// import subFAQS from "@salesforce/apex/ChatBotController.fetchSubFAQS";
// import solFAQS from "@salesforce/apex/ChatBotController.fetchSolution";
import Id from "@salesforce/user/Id";
import fetchImageUrl from "@salesforce/apex/ChatBotController.getProfileUrl";
import chatBot from "@salesforce/resourceUrl/chatBot";
import chatUser from "@salesforce/resourceUrl/chatUser";
import chatBotFAQs from '@salesforce/apex/ChatBotController.getFAQs';
import chatBotSubFAQs from '@salesforce/apex/ChatBotController.getSubFAQs';
import chatBotSolution from '@salesforce/apex/ChatBotController.getSolution';
import chatBotNestedJson from '@salesforce/apex/ChatBotController.extractNestedJSON';
import sendEmailWithAttachment from '@salesforce/apex/ChatBotController.sendEmailWithAttachment';
import Email from '@salesforce/schema/Lead.Email';

export default class ChatBot extends LightningElement {
    @track uploadedFiles = [];
    @track popupOpen = false; //used to open chatbot im child component
    @track issues = []; // options for user to select
    @track isSpinner = true; //used to track status of spinner
    @track textValue;
    @track isClearPopup = false;
    @track isFeedbackPopup = false;
    @track isEmail = false;
    @track toAddress = 'tirthshah452004@gmail.com';
    @track replyAddress = '';
    @track subject = 'Issue in Docgenius';
    @track body = '';
    @track mailSent = false;
    @track hideCircle = false;

    rendered = false;
    acceptedFormats = ['.pdf', '.png', '.jpg', '.doc', '.docx'];
    userId = Id;
    isIssue = false; //used to track if any active issue is there
    isSol = false;  //used to track if any active solution is there
    isTimer = false; //used to track time
    isChatStarted = false;
    messages = [];  //used to store users selected option as message
    solution = null; //used to display solution
    chatBot;
    chatUser;
    time = [1000, 1200, 1400];
    faq;
    item1;
    item2;
    item3;
    item4;
    item5;
    @track question = 'What seems to be causing you trouble?';

    connectedCallback(){
        this.isSpinner = true;
        this.fetchingImageUrl();
        this.chatBot = chatBot;
        this.chatUser = chatUser;
        this.item1 = Feedback+'/item1.svg';
        this.item2 = Feedback+'/item2.svg';
        this.item3 = Feedback+'/item3.svg';
        this.item4 = Feedback+'/item4.svg';
        this.item5 = Feedback+'/item5.svg';  
        this.question = 'What seems to be causing you trouble?';  
        this.getJSON();
          
    }

    renderedCallback() {
            console.log('rendered');

        // if(this.isEmail){
        //     const windowsize = this.template.querySelector('.popupopen');
        //     const windowmessage = this.template.querySelector('.message');
        //     windowsize.style.height = '500px';
        //     windowmessage.style.height = '500px';
        //     windowmessage.style.maxHeight = '500px';
        //     this.rendered = true;
        //     }
        


        // if(!this.rendered){
        //     const style = document.createElement('style');
        //     style.innerHTML = `
        //     .slds-form-element__label{
        //         display : none !important;
        //     }`;

        //     const upload = this.template.querySelector('.upload'); 
        //     if(upload){
        //         upload.appendChild(style);
        //         this.rendered = true;
        //     }
        // }


        this.updateScroll();
        
    }

    getJSON(){
        chatBotNestedJson()
        .then((result)=>{
            console.log('Fetched json');
        });
    }

    checkEmailActive(){
        if(this.isEmail){
            const windowsize = this.template.querySelector('.popupopen');
            const windowmessage = this.template.querySelector('.message');
            windowsize.style.height = '500px';
            windowmessage.style.height = '500px';
            windowmessage.style.maxHeight = '500px';
        }
    }

    handleFilesChange(event) {
        const files = event.target.files;
        const currentLength = this.uploadedFiles.length;

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = () => {
                const fileInfo = {
                    id: currentLength + index + 1, // Assign a unique id starting from 1
                    fileName: file.name,
                    fileNameShort: file.name.length > 18 ? `${file.name.substring(0, 16)}...` : file.name,
                    fileSize: this.formatFileSize(file.size),
                    isImage: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(file.type),
                    displayUrl: reader.result,
                    fileUrl: reader.result.split(',')[1]
                };

                this.uploadedFiles = [...this.uploadedFiles, fileInfo];
            };
            reader.readAsDataURL(file);
        });
    }

    handleInputChange(event){
        const field = event.target.dataset.id;
        if(field === 'replyAddress'){
            this.replyAddress = event.target.value.trim();
            const field = this.template.querySelector('.mail-body input');
            field.style.border = ''; 
        }
        else if(field === 'body'){
            this.body = event.target.value.trim();
            const field = this.template.querySelector('.mail-body textarea');
            field.style.border = ''; 
        }
    }

    formatFileSize(size) {
        console.log(size);
        if (size < 1048576) return (size / 1024).toFixed(1) + ' KB';
        return (size / 1048576).toFixed(1) + ' MB';
    }

    checkPopupStatus(){
        // if(this.isClearPopup){
        //     console.log('checking popup status');
        //     this.toggleClear();
        // }
    }

    checkWord(){

    const keywords = ["EndChat","Integration", "Template Builder", "Template", "GoogleDrive", "Dropbox"];
    const keywordVariations = keywords.reduce((acc, keyword) => {
        const noSpaceKeyword = keyword.replace(/\s+/g, '').toLowerCase();
        acc[keyword] = new RegExp(noSpaceKeyword, 'i');
        return acc;
    }, {});

    // Initialize an empty array to store the found keywords
    const foundKeywords = '';

    // Normalize the input to lower case and remove extra spaces for consistency
    const normalizedInput = this.textValue.toLowerCase().replace(/\s+/g, '');

    // Loop through each keyword variation
    for (const originalKeyword in keywordVariations) {
        const regex = keywordVariations[originalKeyword];
        if (regex.test(normalizedInput)) {
            // If the keyword or its variation is found, add the original keyword to the list
            if (!foundKeywords.includes(originalKeyword)) {
                if(originalKeyword === "EndChat"){
                    this.handleChat();
                    return null;
                }
                console.log(originalKeyword);
                return originalKeyword;
            }
        }
    }
    }

    toggleFeedback(){
        this.isFeedbackPopup = this.isFeedbackPopup ? false : true;
        if(this.isFeedbackPopup){
            const bot = this.template.querySelector('.content');
            bot.style.filter = 'blur(1.5px) brightness(0.9)';
        }
        else{
            const bot = this.template.querySelector('.content');
            bot.style.filter = '';
        }  
    }

    toggleClear(){
        if(this.isFeedbackPopup){
            this.toggleFeedback();
        }
        console.log(this.isClearPopup);
        this.isClearPopup = this.isClearPopup ? false : true;
        if(this.isClearPopup){
            const bot = this.template.querySelector('.content');
            bot.style.filter = 'blur(1.5px) brightness(0.9)';
        }
        else{
            const bot = this.template.querySelector('.content');
            bot.style.filter = '';
        }        
    }

    toggleCircle(){
        this.hideCircle = !this.hideCircle;
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
                        this.messages.push({text: this.solution, isSolution: true});
                    }
                }
            }
        });
        chatBotSubFAQs({key: recid})
        .then((result) =>{
            console.log(result);
            if (result != null && result.length > 0) {
                console.log('invoked subfaq');
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
            console.error('error fetching subfaq', JSON.stringify(error.message));
        });
    }

    fetchingSolFAQS(recid){
        console.log('this is recid inside solFAQS'+recid);
        chatBotSolution({key: recid})
        .then((result) =>{
            console.log('this is result '+result);
            if(!result){
                this.solution = "My apologies, I didn't fully understand. Could you please email us?";
            }
            else{
                this.solution = result;
            }
            if(this.isTimer == true && this.solution != null){
                this.isSpinner = false;
                this.messages.push({text: this.solution, isSolution: true});
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


    handleSendEmail() {
        if(this.replyAddress == ''){
           const field = this.template.querySelector('.mail-body input');
           field.style.border = '1px solid red'; 
        }
        if(this.body == ''){
            const field = this.template.querySelector('.mail-body textarea');
            field.style.border = '1px solid red'; 
        }
        else if(this.body && this.replyAddress){
        const fileNames = this.uploadedFiles.map(file => file.fileName);
        const fileContents = this.uploadedFiles.map(file => file.fileUrl);
        console.log(this.body);
        console.log(this.subject);
        console.log(this.toAddress);
        console.log(fileNames);
        console.log(fileContents);

        sendEmailWithAttachment({
            toAddress: this.toAddress,
            replyTo: this.replyAddress,
            subject: this.subject,
            body: this.body,
            fileNames: fileNames,
            fileContents: fileContents
        })
        .then(result => {
            // handle success, show a success message or toast
            console.log('Email sent successfully');
            this.mailSent = true;
            this.isEmail = false;
        })
        .catch(error => {
            // handle error, show an error message or toast
            if(error.body && error.body.message && error.body.message.includes('INVALID_EMAIL_ADDRESS')){
            const field = this.template.querySelector('.mail-body');
            const newParagraph = document.createElement('p');
            newParagraph.style.color = 'red';
            newParagraph.textContent = 'Invalid Email Address';
            field.appendChild(newParagraph);
            console.error('Error sending email: ', error);
            console.log(error.body);
            console.log(error.body.message);
            }

        });
    }
    }

    fetchingImageUrl(){
        fetchImageUrl({cid: this.userId})
        .then(result =>{
            if(!result.endsWith('/profilephoto/005/F')){
            this.chatUser = result;
            }
        });
    }


    toggleBot(){
        this.popupOpen = true;
        console.log('Is popup open'+this.popupOpen);
        if(!this.isChatStarted){
            this.fetchingMainFAQS();
        }
        setTimeout(
            this.checkEmailActive()
            ,1000);
        console.log('checked');
    }

    togglePopupClose(){
        console.log('closing');
        this.rendered = false;
        this.popupOpen = false;
        this.dispatchEvent(new CustomEvent('toggleclose', {
            detail: {
                message: this.startchat
            }
        }));
    }

    updateScroll(){
        const scrollable = this.template.querySelector('.popupopen .message');
        if (scrollable && scrollable.lastElementChild) {
            scrollable.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
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
        this.messages.push({text: this.question, isQuestion: true});
        this.messages.push({text: event.currentTarget.dataset.value, isAnswer: true});
        this.fetchingSubFAQS(event.currentTarget.dataset.key);

    }

    handleChat(){
        this.isIssue = false;
        this.isSol = false;
        this.issues = null;
        this.messages = [];
        this.solution = null;
        this.Email
        this.isEmail = false;
        this.mailSent = false;
        this.isChatStarted = false;
        const windowsize = this.template.querySelector('.popupopen');
        const windowmessage = this.template.querySelector('.message');
        windowsize.style.height = '430px';
        windowmessage.style.height = '430px';
        windowmessage.style.maxHeight = '430px';
        this.toggleClear();
        this.connectedCallback();
        this.isTimer = false;
        this.fetchingMainFAQS();
    }

    handleClearClose(){
        this.togglePopupClose();
        this.handleChat();
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

    checkEnter(event){

          if (event.key === "Enter") {
            event.preventDefault();
            console.log('check enter');
            this.sendChat();
          }
        
    }

    sendChat(){
        if(this.template.querySelector('.communicate').value != ''){
            if(!this.isChatStarted){
                this.isChatStarted = true;
            }
            this.textValue = this.template.querySelector('.communicate').value;
            console.log(this.textValue);
            this.template.querySelector('.communicate').value = null;
            console.log('Issue with variable');
            this.isIssue = false;
            this.isSol = false;
            this.solution = null;
            this.isSpinner = true;
            this.isTimer = false;
            this.checkSpinnerDuration((result) => {
                console.log(result); // Will log 'success' after a random time
            });
            this.issues = null;
            const key = this.checkWord();
            this.fetchingSubFAQS(key);
            this.messages.push({text: this.textValue, isAnswer: true});
            this.question = 'Is this what you were looking for?';
        }
    }

    handleRemoveFile(event) {
        console.log('removing');
        const fileId = event.target.dataset.id;
        this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== parseInt(fileId, 10));
    }

    toggleitem(event){
        const images = this.template.querySelectorAll('img[data-key]');
    
        images.forEach(img => {
            img.style.filter = 'grayscale()';
        });

        const clickedImage = event.target;
        if(event.target.dataset.key == '1'){          
            console.log('I am 1');
            // clickedImage.style.filter = 'hue-rotate(275deg)';
            clickedImage.style.filter = '';
        }
        else if(event.target.dataset.key == '2'){
            console.log('I am 2');
            clickedImage.style.filter = '';
        }
        else if(event.target.dataset.key == '3'){
            console.log('I am 3');
            clickedImage.style.filter = '';

        }
        else if(event.target.dataset.key == '4'){
            console.log('I am 4');
            clickedImage.style.filter = '';

        }
        else if(event.target.dataset.key == '5'){
            clickedImage.style.filter = '';
            console.log('I am 5');
        }
    }

    submitFeedback(){

    }

    emailPopup(){
        this.isChatStarted = true;
        this.isIssue = false;
        this.isEmail = true;
        this.mailSent = false;
        const windowsize = this.template.querySelector('.popupopen');
        const windowmessage = this.template.querySelector('.message');
        windowsize.style.height = '500px';
        windowmessage.style.height = '500px';
        windowmessage.style.maxHeight = '500px';
    }

}