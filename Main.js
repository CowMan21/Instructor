//__Variables__//
let File
let Running = false

//Settings//
let ScrollWhenRun = true

import {PRT, ERR, DoFunction, SplitFunctionAndParameter, FollowInstruction} from "./Functions.js";

//__Functions__//
function ScriptButtons(State){
    document.getElementById("RUN").disabled = State
    document.getElementById("STOP").disabled = !State
}

function StopScript(){
    Running = false
    ScriptButtons(false)
}

//__Setup__//
ScriptButtons(false)

//__Event listeners__//

//Display the file//
document.getElementById("FILEIMPORTER").addEventListener("change", function(){
    let FReader = new FileReader()

    FReader.onload = function(){
        document.getElementById("SCRIPTAREA").value = this.result

        document.getElementById("FILENAME").value = File.name.replace(".itr", "")
    }

    File = this.files[0]
    FReader.readAsText(File)
})

//Save the file//
document.getElementById("SAVESCRIPT").addEventListener("click", function(){
    const TheBlob = new Blob([document.getElementById("SCRIPTAREA").value], {type: "text/plain"})

    const FileURL = URL.createObjectURL(TheBlob)
    const Link = document.createElement("a")
    
    Link.download = document.getElementById("FILENAME").value + ".itr"
    Link.href = FileURL
    Link.click()
})

//Align script line number scroll with script area scroll//
document.getElementById("SCRIPTAREA").addEventListener("scroll", function(){
    document.getElementById("SCRIPTLINES").scrollTop = document.getElementById("SCRIPTAREA").scrollTop;
    document.getElementById("SCRIPTLINES").scrollLeft = document.getElementById("SCRIPTAREA").scrollLeft;
});

//Update line counter lines//
document.getElementById("SCRIPTAREA").addEventListener("input", function(){
    //Find the amount of lines//
    let LineAmount = document.getElementById("SCRIPTAREA").value.split("\n").length

    //Reset line numbers//
    document.getElementById("SCRIPTLINES").value = ""

    //Add in all line numbers//
    for (let LineNumber = 1; LineNumber <= LineAmount; LineNumber += 1){
        document.getElementById("SCRIPTLINES").value += LineNumber + "\n"
    }
})

//Clear the console//
document.getElementById("CLEARCONSOLE").addEventListener("click", function(){
    document.getElementById("CONSOLE").innerHTML = ""
})

//Stop the script//
document.getElementById("STOP").addEventListener("click", function(){
    StopScript()
})

//Run the script//
document.getElementById("RUN").addEventListener("click", function(){
    ScriptButtons(true)
    Running = true

    //Automatically scroll down to the console if desired//
    if (ScrollWhenRun){
        document.getElementById("CONSOLE").scrollIntoView(true)
    }

    //Print a space in the console//
    PRT("\n \n")
    
    //Get script data//
    let Script = document.getElementById("SCRIPTAREA").value

    let Lines = Script.split("\n")//Separate lines//
    let Instructions = []

    //Go through each line and process it
    Lines.forEach(Line => {
        //Check to see if the line is not blank or is not excluded//
        if (!Line == "\n" && !Line.match(";")){
            //Split this line into instructions using | and the separator//
            let LineInstructions = Line.split("|")

            LineInstructions.forEach(Instruction => {
                Instructions[Instructions.length] = Instruction
            })
        }
    });

    //Go through steps//
    let Step = 0
    let Memory = []
    let Windows = []
    let Loop = setInterval(function(){
        let Instruction = Instructions[Step]
    
        //Process instruction//

        //Follow the instruction//
        let Info = FollowInstruction(Instruction, Step, Memory, Windows, false)
        Step = Info[0]
        Memory = Info[1]
        Windows = Info[2]

        //Has Step gone out of bounds?//
        if (Step < 0){
            ERR("Attempted to step out of bounds: " + Step + " at " + Instruction)
        }

        //If the program has been requested to stop//
        if (Running == false){
            Step = Instructions.length
        }

        //End of loop//
        if (Step >= Instructions.length){
            console.log("FINISHED RUNNING SCRIPT!!!")

            console.log(Memory)
    
            StopScript()

            clearTimeout(Loop)
        }
    }, 100)
})

//__Testing__//