import { LightningElement, api, track, wire } from "lwc";
import { CloseActionScreenEvent } from 'lightning/actions';
export default class CustomeComboBox extends LightningElement {
    @api label;
    @api placeholder;
    @api options;                           // original option list came from parent component...
    @api value;
    @api multiselect;
    @api searchable;
    @api dropdownPosition;
    @api required;

    @track placeholderText = ''             // to set placeholder in markup as per multi select options
    @track dispayOptions = [];              // to display option in dropdown
    @track selectedItems = [];              // to set store and send selcted option to parent component
    @track selectedOptionLabel = null;      // to dispaly selected option in markup (for single select)

    allOptions = [];                        // All Option List Modified Keys....

    @track isMultiSelect;           // define combox is multi-select or not
    @track isSeachable;             // define combox is seachable or not
    @track isRequired;              // define combox is required or not


    get loadStyle(){
        // if combox in searchable, then seachput placed above the backshadow....
        if(this.isSeachable){
            return `position: relative;z-index: 11;`;
        }
        // if combox in not searchable, then dropdown button section placed belowd the backshadow....
        else{
            return `position: relative;`;
        }

    }

    get setDropDownPosition(){
        if(this.dropdownPosition == 'left'){
            return `
                    right: 0% !important;
                    left: auto !important;
                    transform: translateX(0px);
            `
        }
        else if(this.dropdownPosition == 'right'){
            return `
                    left: 0% !important;
                    transform: translateX(0px);
            `
        }
        else{
            // by deafult drop down set to center
            return ''
        }
    }

    connectedCallback(){
        try {
            this.setPlaceHolder();
            this.isSeachable = this.searchable == 'true' ? true : false;
            this.isMultiSelect = this.multiselect == 'true' ? true : false;
            this.isRequired = this.required == 'true' ? true : false;

            if(this.options){
                this.allOptions = JSON.parse(JSON.stringify(this.options));
    
                var tempOptions = JSON.parse(JSON.stringify(this.options));
                tempOptions.forEach(ele => {
                    ele['isSelected'] = false;                                  // by default set all option as unselected
                    ele['originalIndex'] = tempOptions.indexOf(ele);            // set original index of option for re-sorting
                });
    
                this.allOptions = tempOptions;
                this.dispayOptions = tempOptions;
    
                if(this.value){
                    this.setDefaulSection();
                }
            }

        } catch (error) {
            console.error('error inside connectedCallback in custome combobox : ', error.stack);
        }
    }

    // Set defaul value if user passes value...
    setDefaulSection(){
        try {
            var currentOption =  this.dispayOptions.find(option => option.value == this.value)
            if(this.isMultiSelect){
                if(!currentOption.isSelected){
                    this.selectedItems.push(currentOption);
                }
                else{
                    this.selectedItems = this.selectedItems.filter((selectedOption) => {
                        return selectedOption.originalIndex != originalIndex;
                    });
                }
                this.setSelection();
                this.setPlaceHolder();
            }
            else{
                this.selectedOptionLabel = currentOption.label;
                    
                this.selectedItems = [currentOption];
                this.setSelection();
            }
        } catch (error) {
            console.error('error in setDefaulSection custom combox : ', error.stack);
        }
    }

    handleShowDropDown(event){
        try {
            const comboBoxDiv = this.template.querySelector(`[data-id="slds-combobox"]`);
            if(comboBoxDiv){
                comboBoxDiv.classList.add('slds-is-open');
            }

            const backDrop = this.template.querySelector('.backDrop');
            if(backDrop){
                backDrop.style = 'display : block'
            }

            this.sortDisplayItems();

        } catch (error) {
            console.error('error inside handleShowDropDown in custome combobox : ', error.stack);
        }
    }

    handleSearch(event){
        try {
            console.log('search Value : ', event.target.value);
            // this.selectedOptionLabel = event.target.value;
            var searchValue = (event.target.value).toLowerCase();
            if(searchValue == null || searchValue.trim() == '' || searchValue == undefined){
                this.dispayOptions = this.allOptions;
            }
            else{
                this.dispayOptions = this.allOptions.filter((ele) => {
                    return ele.label.toLowerCase().includes(searchValue)
                });
            };
            // sort After each Search
            this.sortDisplayItems();
        } catch (error) {
            console.error('error inside handleSearch in custome combobox : ', error.stack);
        }
    }

    handleOptionClick(event){
        try {
            // Use Original Index as uniqe Value and comparision...
            var originalIndex = event.currentTarget.dataset.oriindex;
            const currentOption = JSON.parse(JSON.stringify(this.dispayOptions.find(option => option.originalIndex == originalIndex)));

            if(this.isMultiSelect){

                // Assign or remove clicked option from selected list...
                if(!currentOption.isSelected){
                    this.selectedItems.push(currentOption);
                }
                else{
                    this.selectedItems = this.selectedItems.filter((selectedOption) => {
                        return selectedOption.originalIndex != originalIndex;
                    });
                }
                this.setSelection();
                this.setPlaceHolder();

                // this logic create a list of selected options with original values...(remove additonal keys...)
                var selectedOptionList = [] ;
                this.selectedItems.forEach((selectedOption) => {
                    selectedOptionList.push(this.options[selectedOption.originalIndex]);
                });

                // Send data to parent compoent...
                this.dispatchEvent(new CustomEvent('select',{
                    detail : selectedOptionList
                }));

            }
            else{
                
                this.selectedOptionLabel = event.currentTarget.dataset.label;
                
                this.selectedItems = [currentOption];
                this.setSelection();

                // this logic create a new variable of selected options with original values...(remove additonal key-values...)
                const selectedOption = this.options[currentOption.originalIndex];

                // if combobox is not multi-select it will return array with only one element...
                this.dispatchEvent(new CustomEvent('select',{detail : 
                    [selectedOption]
                }));
           
                this.closeDropDown();
            }

            this.setErrorBorder();
            
        } catch (error) {
            console.error('error inside handleItemClick in custome combobox : ', error.stack);
        }
    }

    //this method only for Single select Combo-Box
    clearSelection(event){ 
        try {
            this.selectedOptionLabel = null;

            this.dispayOptions.forEach(option => {option.isSelected = false;});
            this.allOptions.forEach(option => {option.isSelected = false;});

            // Send Null Data to parent Compoennt.
            this.dispatchEvent(new CustomEvent('select',{detail : 
                []
            }));

            this.setErrorBorder();
        } catch (error) {
            console.error('error in clearSelection custome combobox : ', error.stack);
        }
    }

    closeDropDown(event){
        try {
            // remove slds-is-open class from combobox div to hide dropdown...
            const comboBoxDiv = this.template.querySelector(`[data-id="slds-combobox"]`);
            if(comboBoxDiv && comboBoxDiv.classList.contains('slds-is-open')){
                comboBoxDiv.classList.remove('slds-is-open');
            }

            // remove backshodow from main div
            const backDrop = this.template.querySelector('.backDrop');
            if(backDrop){
                backDrop.style = 'display : none'
            }

            this.setErrorBorder();
            this.sortDisplayItems();

        } catch (error) {
            console.error('error inside closeDropDown in custome combobox : ', error.stack);
        }
    }

    // Generic Method -> to update intial options list and display option list...as option select and unselect...
    setSelection(){
        try {
            this.dispayOptions.forEach(options => { options.isSelected = this.selectedItems.some(ele => ele.originalIndex == options.originalIndex)});
            this.allOptions.forEach(options => { options.isSelected = this.selectedItems.some(ele => ele.originalIndex == options.originalIndex)});
        } catch (error) {
            console.error('error in setSelection : ', error.stack);
        }
    }

    // Generic Method -> to Set place older as user selecte or unselect options... (Generaly used for multi-Select comobox)
    setPlaceHolder(){
        if(this.selectedItems.length <= 0){
            this.placeholderText = this.placeholder ? this.placeholder : (this.isMultiSelect ? 'Select an Options...' : 'Select an Option...');
        }
        else{
            var length = this.selectedItems.length;
            this.placeholderText = this.selectedItems.length + (length == 1 ? ' option' : ' options') + ' selected';
        }
    }

    //Generic Method -> to Set error border if combox is isRequired == true and no option selected...
    setErrorBorder(){
        try {
            if(this.isRequired){
                if((this.isMultiSelect && this.selectedItems.length == 0) || (!this.isMultiSelect && this.selectedOptionLabel == null)){
                    this.template.querySelector('.slds-combobox__input')
                    .style = `  background-color: rgb(255, 255, 255);
                                border-color: rgb(238 72 65);
                                box-shadow: rgb(243 82 76) 0px 0px 1px 1px;
                    `;
                }
                else {
                    this.template.querySelector('.slds-combobox__input').style = '';
                }
            }
        } catch (error) {
            console.error('error in setErrorBorder in custome combobox  : ', error.stack);
        }
    }

    // Generic Method -> to  sort the display options based on selected or unselect...
    sortDisplayItems(){
        try {
            var dispayOptions = JSON.parse(JSON.stringify(this.dispayOptions));
            // Sort the display options based on selected or unselect...
            dispayOptions.sort((a,b) => {
                if(a.isSelected > b.isSelected){
                    return -1;
                }
                if(a.isSelected < b.isSelected){
                    return 1;
                }
                if(a.isSelected == b.isSelected){
                     if(a.originalIndex < b.originalIndex){
                        return -1;
                     }
                     if(a.label > b.label){
                        return 1;
                     }
                }
            });

            this.dispayOptions = dispayOptions;
            
        } catch (error) {
            console.error('error in sortDisplayItems in custome combobox : ', error.stack);
        }
    }

// === ==== ==== ===  [ API Methods to Access from Parent Components ] === === == === ==== ===

    // When user remove selected option form parent component... use this method to remove it from selecteOption Array.....
    @api
    unselectOption(unselectdOption){
        try {
            this.selectedItems = this.selectedItems.filter((option) => {
                option.isSelected = false;
                return option.value != unselectdOption.value;
            });
            this.setSelection();
            this.setErrorBorder();
            this.setPlaceHolder();
        } catch (error) {
            console.error('error in unselectOption in custome combobox : ', error.stack);
        }
    }

    // Set Error Border from Parent component as per validation on parett compoent...
    @api
    isInvalidInput(isInvalid){
        try {
            // if isInvalid is "TRUE" --> Show Error Border...
            if(isInvalid){
                this.template.querySelector('.slds-combobox__input')
                .style = `  background-color: rgb(255, 255, 255);
                            border-color: rgb(238 72 65);
                            box-shadow: rgb(243 82 76) 0px 0px 1px 1px;
                `;
            }
            // else Remove Error Border...
            else{
                this.template.querySelector('.slds-combobox__input').style = '';
            }
        } catch (error) {
            console.error('error in isInvalidInput : ', error.stack);
            
        }
    }
}