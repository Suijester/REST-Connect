# REST-Connect
REST-Connect is a REST API that acts as a middleman to fetch test cases from o1, execute them in Docker containers, and return any failures. It simplifies automated testing workflows.
REST-Connect currently supports Python, and uses Pytest test cases for software automation, essentially functioning as a part of a CI/CD pipeline.

## Features
- Retrieves test cases from o1, GPT-4, o1-mini, or any GPT model
- Executes tests in isolated Docker containers and saves the images
- Returns failed test cases for further action
- Easy integration with existing testing workflows

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Docker (for containerized execution)

### **1. Installation**
1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/REST-Connect.git
   cd REST-Connect

2. Download the Docker Daemon (can be found at https://www.docker.com/) and run it.
   
3. Import some Python functions or basic programs into the folder.
---

### **2. Usage**

```markdown
## Usage
### Express Server
The Express server provides an endpoint for generating and running test cases for a given code file.

### API Endpoints

#### `POST /run-test-cases`
This endpoint allows you to send a code file and its language to generate and run test cases.

##### Request Body:
```json
{
  "codeFile": "path/to/your/code.py", 
  "language": "python"                 
}

```
```markdown

EXAMPLE:

curl -X POST http://localhost:3000/run-test-cases \
-H "Content-Type: application/json" \  
-d '{
    "codeFile": "path/to/your/code.py",  
    "language": "python"  
}'
```
```markdown
### CLI Interface
If you only need to run one file and don't care about sending multiple and executing, you can perform:

```bash
npx tsx src/index.ts path/to/your/code.py python
```

### **3. Dependencies**
List any external libraries or tools required to run your project.

```markdown
## Dependencies
The project relies on the following dependencies:

- **Express**: Web framework for Node.js.
- **OpenAI**: Official Node.js client for interacting with OpenAI's API.
- **dotenv**: For loading environment variables from a `.env` file.
- **fs**: File system module to read/write files.
- **child_process**: For executing commands in the system shell (used for Docker).

You can install these dependencies with:
```bash
npm install express openai dotenv fs child_process
```


### **4. FAQ (Frequently Asked Questions)**
You can include common troubleshooting tips and answers to frequently asked questions about your server.

```markdown
## FAQ

**Q: How do I test a Python file?**  
A: Simply send the path to your Python file along with the language `python` as parameters in the `POST /run-test-cases` request, or perform a CLI Interface request as detailed above.

**Q: What should I do if I get a 500 Internal Server Error?**  
A: Check the server logs for detailed error information. It might be an issue with the OpenAI API or the code you’re testing.

**Q: GPT doesn't return test cases!**
A: Check that you've made an env file for your GPT API Key.

**Q: How can I change the port the server listens on?**  
A: Set the `port` variable in your `src/index.ts` file to your desired port number.
```

## Acknowledgements

- **Express**: This project uses the Express framework, for the easy setup of a web server that functions as an API.
- **OpenAI**: Thanks to OpenAI for providing the API and SDK that enable test case generation.
- **Docker**: Docker quickly containerizes and executes code, easily taking snapshots and running test cases.
- **npm**: For package management and making it easy to install and manage dependencies.
