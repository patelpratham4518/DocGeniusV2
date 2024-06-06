public with sharing class ChatBotController {
    public ChatBotController() {
    }

    private static final String FAQ_JSON = '{' +
        '"question": "Integration",' +
        '"answer": "Refer Userguide",' +
        '"subQuestions": [' +
            '{' +
                '"question": "Dropbox",' +
                '"answer": "solution Found",' +
                '"subQuestions": [' +
                    '{' +
                        '"question": "Client-id & client-secret",' +
                        '"answer": "Answer 1"' +
                    '},' +
                    '{' +
                        '"question": "Redirect uri",' +
                        '"answer": "Answer 2"' +
                    '},' +
                    '{' +
                        '"question": "Unable to Integrate",' +
                        '"answer": "Answer 3"' +
                    '},' +
                    '{' +
                        '"question": "Remove Integration",' +
                        '"answer": "Answer 4"' +
                    '}' +
                ']' +
            '},' +
            '{' +
                '"question": "OtherService",' +
                '"answer": "other solution",' +
                '"subQuestions": []' +
            '}' +
        ']' +
    '}';

    private static final String FAQ_JSON_1 = '[{' +
    '"question": "Integration",' +
    '"answer": "Refer Userguide",' +
    '"subQuestions": [' +
        '{' +
            '"question": "Dropbox",' +
            '"answer": "solution Found",' +
            '"subQuestions": [' +
                '{' +
                    '"question": "Client-id & client-secret",' +
                    '"answer": "Answer 1"' +
                '},' +
                '{' +
                    '"question": "Redirect uri",' +
                    '"answer": "Answer 2"' +
                '},' +
                '{' +
                    '"question": "Unable to Integrate",' +
                    '"answer": "Answer 3"' +
                '},' +
                '{' +
                    '"question": "Remove Integration",' +
                    '"answer": "Answer 4"' +
                '}' +
            ']' +
        '},' +
        '{' +
            '"question": "OneDrive",' +
            '"answer": "solution Found",' +
            '"subQuestions": [' +
                '{' +
                    '"question": "Client-id & client-secret",' +
                    '"answer": "Answer 11"' +
                '},' +
                '{' +
                    '"question": "Redirect uri",' +
                    '"answer": "Answer 2"' +
                '},' +
                '{' +
                    '"question": "Unable to Integrate",' +
                    '"answer": "Answer 3"' +
                '},' +
                '{' +
                    '"question": "Remove Integration",' +
                    '"answer": "Answer 4"' +
                '}' +
            ']' +
        '},' +
        '{' +
            '"question": "GoogleDrive",' +
            '"answer": "solution Found",' +
            '"subQuestions": [' +
                '{' +
                    '"question": "Client-id & client-secret",' +
                    '"answer": "Answer 111"' +
                '},' +
                '{' +
                    '"question": "Redirect uri",' +
                    '"answer": "Answer 2"' +
                '},' +
                '{' +
                    '"question": "Unable to Integrate",' +
                    '"answer": "Answer 3"' +
                '},' +
                '{' +
                    '"question": "Remove Integration",' +
                    '"answer": "Answer 4"' +
                '}' +
            ']' +
        '},' +
        '{' +
            '"question": "AWS",' +
            '"answer": "solution Found",' +
            '"subQuestions": [' +
                '{' +
                    '"question": "Client-id & client-secret",' +
                    '"answer": "Answer 1111"' +
                '},' +
                '{' +
                    '"question": "Redirect uri",' +
                    '"answer": "Answer 2"' +
                '},' +
                '{' +
                    '"question": "Unable to Integrate",' +
                    '"answer": "Answer 3"' +
                '},' +
                '{' +
                    '"question": "Remove Integration",' +
                    '"answer": "Answer 4"' +
                '}' +
            ']' +
        '}' +
    ']' +
'},{' +
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

    @AuraEnabled
    public static String getJsonFaqs() {
        return FAQ_JSON_1;
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
        // List<QuestionWrapper> subQuestions = new List<QuestionWrapper>();
        List<String> subFAQs = new List<String>();
        // List<QuestionWrapper> subFAQs = new List<QuestionWrapper>();
        List<QuestionWrapper> faqList = (List<QuestionWrapper>) JSON.deserialize(FAQ_JSON, List<QuestionWrapper>.class);
        subFAQs = findSubQuestions(FAQ_JSON, key);
        // for (QuestionWrapper questWrapper : faqList) {
        // if (questWrapper.question == key) {
        //     subQuestions.addAll(questWrapper.subQuestions);
        //     break;
        // }
        // System.debug(subQuestions);
        // }
        // if(!subQuestions.isEmpty()){
        //     for(QuestionWrapper subQuestWrapper: subQuestions){
        //         subFAQs.add(subQuestWrapper.question);
        //         System.debug(subFAQS);
        //     }
        // }
        if(subFAQS != null)
        {
            return subFAQS;
        }
        return null;
    }

    @AuraEnabled
    public static void extractNestedJSON() {
        // Parse the JSON string
        Map<String, Object> jsonMap = (Map<String, Object>) JSON.deserializeUntyped(FAQ_JSON);
        // Function to find and extract the nested subQuestions
        System.debug('1');
        Object nestedSubQuestions = extractSubQuestions(jsonMap);

        // Convert the result back to JSON string if nested subQuestions are found

        System.debug('final answer-->'+nestedSubQuestions);
        // if (nestedSubQuestions != null) {
        //     String extractedJSON = JSON.serializePretty(nestedSubQuestions);
        //     System.debug(extractedJSON);
        // } else {
        //     System.debug('No nested subQuestions found');
        // }
    }

    private static List<Object> extractSubQuestions(Object jsonObj) {
        System.debug('2');
        if (jsonObj instanceof Map<String, Object>) {
            System.debug('3');
            Map<String, Object> jsonMap = (Map<String, Object>) jsonObj;
            if (jsonMap.containsKey('subQuestions') && jsonMap.get('subQuestions') != null) {
                System.debug('4');
                List<Object> subQuestions = (List<Object>) jsonMap.get('subQuestions');
                // for (Object subQuestionObj : subQuestions) {
                //     Object result = extractSubQuestions(subQuestionObj);
                //     if (result != null) {
                //         return result;
                //     }
                // }
                System.debug('subquestion-->'+subQuestions);
                return subQuestions;
            }
        }
        return null;
    }

    public static List<String> findSubQuestions(String filteredJson, String key) {
        List<String> subQuestions = new List<String>();
        
        // Parse the filtered JSON string into a list of QuestionWrapper objects
        List<QuestionWrapper> filteredFaqList = (List<QuestionWrapper>) JSON.deserialize(filteredJson, List<QuestionWrapper>.class);
        
        // Search for the parent question within the filtered FAQ list
        for (QuestionWrapper questWrapper : filteredFaqList) {
            if (questWrapper.question == key) {
                // If parent question is found, iterate through its subquestions
                if (questWrapper.subQuestions != null && !questWrapper.subQuestions.isEmpty()) {
                    for (QuestionWrapper subQuestWrapper : questWrapper.subQuestions) {
                        subQuestions.add(subQuestWrapper.question); // Add subquestion to the list
                    }
                }
                break; // No need to continue searching once parent question is found
            }
        }
        
        return subQuestions;
    }


    @AuraEnabled
    public static String getSolution(String key) {
        List<QuestionWrapper> faqList = (List<QuestionWrapper>) JSON.deserialize(FAQ_JSON, List<QuestionWrapper>.class);
        return findSolution(faqList, key);
    }

    private static String findSolution(List<QuestionWrapper> faqList, String key) {
        for (QuestionWrapper questWrapper : faqList) {
            if (questWrapper.question.equals(key)) {
                return questWrapper.answer;
            } else if (questWrapper.subQuestions != null && !questWrapper.subQuestions.isEmpty()) {
                // Continue searching in the nested subquestions
                String answer = findSolution(questWrapper.subQuestions, key);
                if (answer != null) {
                    return answer;
                }
            }
        }
        return null;
    }

    @AuraEnabled
    public static String getProfileUrl(String cid) {
        User cuser = [SELECT Id, FullPhotoUrl FROM User WHERE Id=:cid];
        System.debug(cuser.FullPhotoUrl);
        return cuser.FullPhotoUrl;
    }

    @AuraEnabled(cacheable=true)
    public static List<ContentVersion> getFileDetails(List<Id> contentDocumentIds) {
        return [
            SELECT Id, Title, ContentSize, ContentDocumentId 
            FROM ContentVersion 
            WHERE ContentDocumentId IN :contentDocumentIds
        ];
    }

    @AuraEnabled
    public static void sendEmailWithAttachment(String toAddress, String subject, String body, List<String> fileNames, List<String> fileContents, String replyTo) {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new String[] { toAddress });
        mail.setSubject(subject);
        mail.setPlainTextBody(body);

        if (replyTo != null && replyTo != '') {
            mail.setReplyTo(replyTo);
        }
        
        // Prepare attachments
        if (fileNames != null && fileContents != null && fileNames.size() == fileContents.size()) {
            List<Messaging.EmailFileAttachment> attachments = new List<Messaging.EmailFileAttachment>();
            for (Integer i = 0; i < fileNames.size(); i++) {
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(fileNames[i]);
                attachment.setBody(EncodingUtil.base64Decode(fileContents[i]));
                attachments.add(attachment);
            }
            mail.setFileAttachments(attachments);
        }
        
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }

    @AuraEnabled
    public static void sendFeedbackEmail(String toAddress, String key) {
        String subject = 'Feedback for chatbot';
        String body = 'I used Chatbot and my rating is ' + key + ' out of 5';
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new String[] { toAddress });
        mail.setSubject(subject);
        mail.setPlainTextBody(body);      
        
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }
}