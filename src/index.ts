import {OpenAI} from 'openai';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {exec} from 'child_process';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


type OpenAIResponse = {
    choices?: {message:{content: string}}[];
};

const generateCases = async (functionCode: string, language: string): Promise<string> => {
    try {
        // prompt for OpenAI's API, modify as you need
        const prompt = `You are a skilled and experienced software tester. Below is code written in ${language}. Your task is to write multiple test cases for the program, each of which will fail if they encounter logical errors and edge cases. Identify logic errors, and let the test cases fail to show that the program is incorrect. Ensure at least ten rigorous test cases are generated, but below twenty, each of which can fail. These tests should follow the conventions of the testing framework in ${language}.

        Make sure the test cases do not cause runtime issues (such as syntax errors, missing imports, or invalid references). Your tests should be well-structured and executable as-is in the provided testing framework. Any functions or classes used should be correctly renamed if necessary to avoid issues. Showcase logic errors with test cases.

        Program:
        ${functionCode}

        Please generate test cases in ${language}, focusing on catching errors when the input is incorrect, and failing if the function produces incorrect results or breaks under edge cases. For Python, use pytest. Import only modules you need, assume that the function is already in the file, and DO NOT USE BACKTICKS, STRING LITERALS, OR MARKDOWN WHERE IT SHOULD NOT BE.`;

        // calling the API, the model use is usually subjective -- for longer programs, I would recommend o1, but for shorter ones, o1-mini works great
        const response = await openai.chat.completions.create({
            model: 'o1-preview',
            messages: [
                {role: 'user', content: prompt}
            ],
        }) as OpenAIResponse;

        if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
            const messageContent = response.choices[0].message.content;
            return messageContent;
        } else {
            throw new Error ('OpenAI API Response to prompt was malformed.')
        }
    } catch (error) {
        console.error('Test Cases could not be generated: ', error);
        throw error;
    }
}

//if you don't want to clear the directories, you can comment out the cleanFiles function
const cleanFiles = async (directory: string) => {
    try {
        await fs.promises.rm(directory, {recursive: true, force: true});
        console.log(`Directory ${directory} has been cleaned.`);
    } catch (error) {
        console.error(`Error cleaning directory ${directory}: `, error);
        throw error;
    }
};

const cleanCode = async (filePath: string): Promise<void> => {
    try {
        const code = fs.readFileSync(filePath, 'utf-8');

        const prompt = `You are a skilled and experienced software tester/refactorer. Clean the following code to make my program run. The message you return will have be the cleaned code, without any backticks, string literals, or markdown that prevent the IMMEDIATE running and execution of my code. The message you return MUST be able to be run immediately. Do not include things like [As above.] or other invalid syntaxes, and do NOT correct any code, merely clean the file so it can be compiled and run immediately. Refrain from adding your own comments and the like.

        Program: ${code}`;
        const response = await openai.chat.completions.create({
            model: 'o1-preview',
            messages: [
                {role: 'user', content: prompt}
            ],
        }) as OpenAIResponse;

        if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
            let cleanCode = response.choices[0].message.content;
            cleanCode = cleanCode.replace(/```[\s\S]*?```/g, '');
            await fs.promises.writeFile(filePath, cleanCode);
        } else {
            throw new Error ('OpenAI API Response to code cleaning was malformed.')
        }
    } catch (error) {
        console.error(`Error reading file ${filePath}: `, error);
        throw error;
    }
}
// this runs test cases in a docker container, and returns failed tests - Dockerfile.python is the name of the docker file for python
const runTestCases = async (functionCode: string, language: string, testCases: string) => {
    const workDir = path.resolve(__dirname, 'dockerspace');
    await fs.promises.mkdir(workDir, {recursive: true});

    if (language.toLowerCase() === 'python') {
        const testFile = path.join(workDir, 'test_program.py');
        await fs.promises.writeFile(testFile, functionCode + '\n' + testCases);
        await cleanCode(testFile);

        const dockerfile = 'Dockerfile.python';

        return new Promise((resolve, reject) => {
            exec(`docker build -f ${dockerfile} -t code-runner . && docker run --rm -v ${workDir}:/app code-runner`, 
                (error, stdout, stderr) => { 
                    if (error) {
                        console.error('Docker Error:', stderr || error.message);
                        reject(stderr || error.message);
                    } else {
                        console.log('Docker Output:', stdout);
                        const failedTests = stdout.match(/FAILED.*$/gm) || [];
                        resolve(failedTests);
                    }
                    cleanFiles(workDir);
                }
            );
        });
    }
};

// accepts a file and language as arguments after the script, so 'npx tsx src/index.ts path/to/file.py python'
// check if proper args and syntax are provided for CLI mode
const [,, codeFile, language] = process.argv;

if (codeFile && language) {
    if (!codeFile || !language) {
        console.error("Program Code File path or code language not provided.");
        process.exit(1);
    }

    const programCode = fs.readFileSync(path.resolve(codeFile), 'utf-8');
    generateCases(programCode, language)
        .then(testCases => runTestCases(programCode, language, testCases))
        .then(failedTests => console.log('Failed Tests:'))
        .catch(error => console.error('Error:', error));
        
} else {
    const app = express();
    const port = 3000;
    app.use(express.json());

    app.post('/run-test-cases', async (req, res) => {
        const {codeFile, language} = req.body;

        if (!codeFile || !language) {
            res.status(400).json({error: "Program Code File path or language not provided."});
            return;
        }

        try {
            const programCode = fs.readFileSync(path.resolve(codeFile), 'utf-8');
            const testCases = await generateCases(programCode, language);
            const failedTests = await runTestCases(programCode, language, testCases);

            res.json({failedTests});
            return;
        } catch (error) {
            console.error("Error during test case generation or execution:", error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}