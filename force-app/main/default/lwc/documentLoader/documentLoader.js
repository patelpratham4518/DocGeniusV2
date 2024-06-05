import { LightningElement, api } from "lwc";
export default class DocumentLoader extends LightningElement {
	
	@api label;			// If You want to set custom label

	@api fixedPosition; // In case of need to set CSS Position: fixed...

	@api noneBackdrop; // In Case You Don't want to show backdrop effect...

	@api customHeight; // IF You want to set custom Height of a Loader...


	get loadingLabel(){
		return this.label ? this.label : 'LOADING...';
	}

	get loadStyle(){
		var style = '';
		style += this.fixedPosition == "true" ? `position : fixed !important;` : '';
		style += this.noneBackdrop == "true" ? `background : transparent !important; backdrop-filter : none !important;` : '';
		style += this.customHeight ? `--documerPageHeight : ${this.customHeight};` : '';
		return style;
	}

}