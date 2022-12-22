//__Language functions for in program__//

export function PRT(Text){
    let Output = Text

    //Turn an array into a string//
    if (typeof(Text) == "object"){
        Output = Text.join(", ")
    }

    document.getElementById("CONSOLE").innerHTML = Output + "<br>" + document.getElementById("CONSOLE").innerHTML

    return true
}

export function ERR(Text){
    let Output = Text

    if (typeof(Text) == "object"){
        Output = Text.join(", ")
    }

    PRT("<a id='ERRORMESSAGE'>[" + CurrentStep + "] " + "ERROR: " + Output + "</a>")

    document.getElementById("STOP").click()
}


//__Non language functions for outside of program__//
var CurrentStep = 0

function ToBool(String){
    let Bool = true

    if (String == "NIL" || String == undefined || String == false || Number(String == 0) || String == "FALSE"){
        Bool = false
    }

    return Bool.toString().toUpperCase()
}

function CheckParameter(ToCheck, ExpectedType, Parameters, ParameterNumber, Function){
    let Parameter = Parameters[ParameterNumber]
    if ((Parameter == undefined || Parameter == "") && Parameter != false){
        ERR("Parameter " + (ParameterNumber + 1) + " of: " + Function + " is not filled out")
    }

    if (ExpectedType == "number" && isNaN(Number(ToCheck))){
        let Type = "NIL"
        if (ToCheck != undefined){
            Type = typeof(ToCheck)
        }

        ERR("Expected type: " + ExpectedType.toUpperCase() + ", but got: " + Type.toUpperCase())
    }
}

function CheckSecondOrder(IsSecondOrder, SecondOrder, Function){
    if (IsSecondOrder == true &&  SecondOrder == false){ //Is second order, but used first order//
        ERR(Function + " can not be used on its own!")
    }else if (IsSecondOrder == false &&  SecondOrder == true){ //Is first order, but used second order//
        ERR(Function + " can not be used second order!")
    }

    return IsSecondOrder == SecondOrder
}

function EvaluateOperator(Function, Parameters, SecondOrder){
    let Result = 0

    if (!SecondOrder){
        ERR(Function + " can not be called on its own!")
    }else{
        CheckParameter(Parameters[0], "number", Parameters, 0, Function)
        CheckParameter(Parameters[1], "number", Parameters, 1, Function)

        //Work the operator//

        //BASIC//
        if (Function == "ADD"){ //Add//
            Result = Number(Parameters[0]) + Number(Parameters[1])
        }else if (Function == "SUB"){ //Subtract//
            Result = Number(Parameters[0]) - Number(Parameters[1])
        }else if (Function == "MUL"){ //Multiply//
            Result = Number(Parameters[0]) * Number(Parameters[1])
        }else if (Function == "DIV"){ //Divide//
            Result = Number(Parameters[0]) / Number(Parameters[1])
        }
        //ADVANCED//
        else if (Function == "MOD"){ //Modulus//
            Result = Number(Parameters[0]) % Number(Parameters[1])
            console.log(Result)
        }else if (Function == "POW"){ //Power//
            Result = Number(Parameters[0]) ** Number(Parameters[1])
        }

        return Result.toString()
    }
}

export function SplitFunctionAndParameter(Instruction){
    let HitColon = false
    let SplitString = ["", ""]
    
    Instruction.split("").forEach(Character => {
        if (Character == ":" && !HitColon){ //Hit a colon//
            HitColon = true
        }else {
            //Add to parameters or to function//
            if (HitColon){ //Parameters//
                SplitString[1] += Character
            }else{ //Function//
                SplitString[0] += Character
            }
        }
    });

    return SplitString
}

function SplitParameters(Parameters){
    let SplitParameters = [""]
    let ParameterNumber = 0
    let ParenthesisLevel = 0
    let StartingLevel = 0
    let ParenthesisIncomplete = 0

    console.log(Parameters)

    //(ADD:1,2)//

    //If there are parenthesis at the begining of the parameter, keep them at level 0//
    if (Parameters.split("")[0] == "("){
        StartingLevel = 1
    }

    //Go through each character//
    Parameters.split("").forEach(Character => {
        let Ignore = false

        if (Character == "("){ //Hit an open parenthesis//
            if (ParenthesisLevel == 0){
                Ignore = true
            }

            ParenthesisLevel += 1
            ParenthesisIncomplete += 1
        }else if (Character == ")"){//Hit a close parenthesis//
            ParenthesisLevel -= 1 
            ParenthesisIncomplete -= 1
        }else if (Character == "," && ParenthesisLevel == 0){ //Next parameter//
            ParameterNumber += 1
            SplitParameters[ParameterNumber] = ""
        }
        
        if ((Character != "(" && Character != ")" && Character != ",") || ParenthesisLevel != 0 && !Ignore){ //Part of a parameter//
            SplitParameters[ParameterNumber] += Character
        }
    })

    //Make sure that all parenthesis have been closed//
    if (ParenthesisIncomplete != 0){
        ERR("Parenthesis has not been closed")
    }

    console.log(SplitParameters)

    return SplitParameters
}

export function FollowInstruction(Instruction, Step, Memory, Windows, SecondOrder){
    CurrentStep = Step

    //Split the instruction into the function and its parameters//
    let SplitString = SplitFunctionAndParameter(Instruction)

    //See if the instruction is valid//
    if (!SplitString[1]){
        ERR("Function called without parameters: " + Instruction)

        return [Step, Memory]
    }else{
        let Function = SplitString[0]
        let Parameters = SplitParameters(SplitString[1])

        return DoFunction(Function, Parameters, Step, Memory, Windows, SecondOrder)
    }
}

function EvaluateParameter(Parameter, Step, Memory){
    //Is the parameter a command? If so, turn it into a value//
    if (Parameter.match(":")){ //Instruction//
        Parameter = FollowInstruction(Parameter, Step, Memory, true)
    }

    return Parameter
}

export function DoFunction(Function, Parameters, Step, Memory, Windows, SecondOrder){
    /*
    NOTES:
    - DO NOT forget to advance Step in each function!
    */

    //Evaluate all parameters//
    for (let i = 0; i < Parameters.length; i += 1){
        let Parameter = Parameters[i]
        Parameters[i] = EvaluateParameter(Parameter, Step, Memory)
    }

    //Determine the function//

    /*
    SecondOrder means that the function has been run from a parameter.
    For example:
    PRT:RD:1

    RD:1 would be second order, PRT: would not.
    */

    //BASIC//
    if (Function == "SET" && CheckSecondOrder(false, SecondOrder, Function)){ //Set//
        CheckParameter(Parameters[0], "number", Parameters, 0, Function)
        CheckParameter(Parameters[1], "any", Parameters, 1, Function)

        Memory[Parameters[0]] = Parameters[1]
    }else if (Function == "REP" && CheckSecondOrder(false, SecondOrder, Function)){ //Replace//
        CheckParameter(Parameters[0], "number", Parameters, 0, Function)
        CheckParameter(Parameters[1], "number", Parameters, 1, Function)

        Memory[Parameters[0]] = Memory[Parameters[1]]
    }else if (Function == "SWP" && CheckSecondOrder(false, SecondOrder, Function)){ //Swap//
        CheckParameter(Parameters[0], "number", Parameters, 0, Function)
        CheckParameter(Parameters[1], "number", Parameters, 1, Function)

        let Mem0 = Memory[Parameters[0]]
        let Mem1 = Memory[Parameters[1]]

        Memory[Parameters[0]] = Mem1
        Memory[Parameters[1]] = Mem0
    }else if (Function == "RD" && CheckSecondOrder(true, SecondOrder, Function)){ //Read//

            CheckParameter(Parameters[0], "number", Parameters, 0, Function)

            //Make sure the memory is not undefined//
            if (Memory[Parameters[0]] == undefined){
                ERR("Memory " + Parameters[0] + " has not been defined!")
            }

            return Memory[Parameters[0]]

    }
    else if (Function == "SKP" && CheckSecondOrder(false, SecondOrder, Function)){ //Skip//

        CheckParameter(Parameters[0], "number", Parameters, 0, Function)

        Step += Parameters[0] - 1
    }
    else if (Function == "PRT" && CheckSecondOrder(false, SecondOrder, Function)){ //Print//
        CheckParameter(Parameters[0], "any", Parameters, 0, Function)

        PRT(Parameters)
    }
    else if (Function == "ERR" && CheckSecondOrder(false, SecondOrder, Function)){ //Error//
        CheckParameter(Parameters[0], "any", Parameters, 0, Function)

        ERR(Parameters)
    }
    //MATHS//
    else if (Function == "ADD" || Function == "SUB" || Function == "MUL" || Function == "DIV" || Function == "POW" || Function == "MOD" && CheckSecondOrder(true, SecondOrder, Function)){ //Two parameter operators//
        return EvaluateOperator(Function, Parameters, SecondOrder)
    }
    //LOGIC//
    else if (Function == "EQU" && CheckSecondOrder(true, SecondOrder, Function)){ //Equal (Are A and B the same)//
        CheckParameter(Parameters[0], "any", Parameters, 0, Function)
        CheckParameter(Parameters[1], "any", Parameters, 1, Function)

        return ToBool(Parameters[0] == Parameters[1])
    }else if (Function == "DIF" && CheckSecondOrder(true, SecondOrder, Function)){ //Different (Are A and B different)//
        CheckParameter(Parameters[0], "any", Parameters, 0, Function)
        CheckParameter(Parameters[1], "any", Parameters, 1, Function)

        return ToBool(Parameters[0] != Parameters[1])
    }
    //STATEMENTS//
    else if (Function == "IF" && CheckSecondOrder(false, SecondOrder, Function)){ //IF//
        CheckParameter(Parameters[0], "any", Parameters, 0, Function)
        CheckParameter(Parameters[1], "number", Parameters, 1, Function)

        if(ToBool(Parameters[0]) == "FALSE"){
            Step += Parameters[1] - 1
        }
    }
    //GRAPHICS//
    else if (Function == "G_NEW" && CheckSecondOrder(false, SecondOrder, Function)){ //New graphics window//
        CheckParameter(Parameters[0], "number", Parameters, 0, Function)
        CheckParameter(Parameters[1], "any", Parameters, 1, Function)
        CheckParameter(Parameters[2], "number", Parameters, 2, Function)
        CheckParameter(Parameters[3], "number", Parameters, 3, Function)

        let NewWindow = window.open("", Parameters[1], "width=" + Parameters[2] + ",height=" + Parameters[3])
        
        Windows[Parameters[0]] = NewWindow
        NewWindow.document.write("Hello!")
    }
    //OTHER//
    else{ //Unrecognised function//
        ERR("Unrecognised function in current context: " + Function + " with parameters: " + Parameters.join(","))
    }

    Step += 1

    return [Step, Memory, Windows]
}