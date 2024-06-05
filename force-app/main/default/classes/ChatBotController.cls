public with sharing class ChatBotController {
    public ChatBotController() {

    }

    private static final String FAQ_JSON = '[{' +
        '"question": "Integration",' +
        '"answer": "Refer Userguide",' +
        '"subQuestions": [' +
            '{' +
                '"question": "Dropbox",' +
                '"answer": "No solution Found"' +
            '},' +
            '{' +
                '"question": "OneDrive",' +
                '"answer": "No solution Found"' +
            '},' +
            '{' +
                '"question": "GoogleDrive",' +
                '"answer": "No solution Found"' +
            '},' +
            '{' +
                '"question": "AWS",' +
                '"answer": "No solution Found"' +
            '}' +
        ']' +
    '},' +
    '{' +
        '"question": "Template Builder",' +
        '"answer": "Refer Userguide",' +
        '"subQuestions": [' +
            '{' +
                '"question": "Simple Template",' +
                '"answer": "No solution Found"' +
            '},' +
            '{' +
                '"question": "Drag and Drop Template",' +
                '"answer": "No solution Found"' +
            '},' +
            '{' +
                '"question": "CSV Template",' +
                '"answer": "No solution Found"' +
            '},' +
            '{' +
                '"question": "Advanced Template",' +
                '"answer": "No solution Found"' +
            '}' +
        ']' +
    '}]';

    public class QuestionWrapper {
        public String question { get; set; }
        public String answer { get; set; }
        public List<QuestionWrapper> subQuestions { get; set; }

        public QuestionWrapper(String question,String answer,List<QuestionWrapper> subQuestions) {
            this.question = question;
            this.answer = answer;
            this.subQuestions = subQuestions;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getFAQs() {
        List<String> mainFAQS = new List<String>();
        List<QuestionWrapper> faqList = (List<QuestionWrapper>) JSON.deserialize(FAQ_JSON, List<QuestionWrapper>.class);
        if (!faqList.isEmpty()) {
            System.debug('total main Question: ' + faqList.size());
            System.debug('First Question: ' + faqList.get(0).question);
        }
        for (QuestionWrapper questWrapper : faqList) {
        mainFAQS.add(questWrapper.question);
        System.debug(mainFAQS);
        }
        return mainFAQS;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getSubFAQs(String key){
        List<QuestionWrapper> subQuestions = new List<QuestionWrapper>();
        List<String> subFAQs = new List<String>();
        List<QuestionWrapper> faqList = (List<QuestionWrapper>) JSON.deserialize(FAQ_JSON, List<QuestionWrapper>.class);
        for (QuestionWrapper questWrapper : faqList) {
        if (questWrapper.question == key) {
            subQuestions.addAll(questWrapper.subQuestions);
            break;
        }
        System.debug(subQuestions);
        }
        if(!subQuestions.isEmpty()){
            for(QuestionWrapper subQuestWrapper: subQuestions){
                subFAQs.add(subQuestWrapper.question);
                System.debug(subFAQS);
            }
        }
        return subFAQS;
    }
}