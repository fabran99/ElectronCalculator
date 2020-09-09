const remote = require("electron").remote;
const currentWindow = remote.getCurrentWindow();

const operators = ["*", "+", "÷", "-", "/"];
const simple_operators = ["-", "+"];
const equal = "=";
const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."];
const funcs = ["CE", "C", "DEL"];
const calc_stats = ["writing", "showing_result"];

const getEl = (id) => {
  return document.getElementById(id);
};

const getLast = (list) => {
  return list[list.length - 1];
};

const isIn = (list, item) => {
  return list.indexOf(item) != -1;
};

class Calculator {
  constructor() {
    this.result = "0";
    this.operation = "";
    this.state = "writing";
    this.operationDiv = getEl("operation");
    this.resultDiv = getEl("result");
    this.lastResult = "0";
    this.init();
  }

  init() {
    // this.resetCalc();
    var buttons = document.querySelectorAll(".button_table button");
    document.onkeydown = (e) => {
      let key = e.key;
      if (key == "Enter") {
        this.updateCalc();
      } else if (isIn([...operators, ...numbers], key)) {
        this.handleButton(key);
      } else if (key == "Backspace") {
        this.handleFuncs("DEL");
      } else if (key == "Escape") {
        this.handleFuncs("CE");
      }
    };

    buttons.forEach((button, i) => {
      var id = button.id;
      // Si es equal, mando a calcular
      if (id == equal) {
        button.onclick = this.updateCalc.bind(this);
      }
      // Si es un numero o operador mando a la funcion que corresponde
      else if (!isIn(funcs, id)) {
        button.onclick = this.handleButton.bind(this, button.id);
      } else {
        button.onclick = this.handleFuncs.bind(this, button.id);
      }
    });
  }

  updResult(new_result) {
    // Actualizo el state y muestro en pantalla
    this.result = new_result;
    var parsed_result = this.handleResult(this.result);
    this.resultDiv.innerHTML = parsed_result;

    // Evito que el valor del resultado se salga de la pantalla
    if (parsed_result.length > 7) {
      var basic_size = 4;
      var size = basic_size;
      size = size - 0.35 * (parsed_result.length - 7);

      // Evito valores muy chicos
      size = Math.max(size, 1.7);

      this.resultDiv.style.fontSize = `${size}em`;
    } else {
      this.resultDiv.style.fontSize = `4em`;
    }
  }

  updOperation(new_operation) {
    // Actualizo el state y muestro en pantalla
    this.operation = new_operation;
    this.operationDiv.innerHTML = this.handleOperation().operation;
  }

  handleButton(button) {
    var replace_result =
      this.result == "" || this.result == "0" || this.state == "showing_result";
    // Manejo numeros y puntos
    if (isIn(numbers, button)) {
      if (replace_result) {
        if (button == "0") {
          return;
        }
        if (button == ".") {
          this.updResult(`0.`);
          this.updOperation((this.operation += `0.`));
        } else {
          this.updResult(`${button}`);
          this.updOperation(this.operation + `${button}`);
        }
      } else {
        this.updResult(this.result + button);
        this.updOperation(this.operation + button);
      }
    } else {
      if (this.operation == "") {
        this.updOperation(`${this.lastResult}${button}`);
        this.updResult("0");
      } else if (isIn(operators, getLast(this.operation.split("")))) {
        let opArr = this.operation.split("");
        let lastOperator = getLast(opArr);
        let preLastOperator = getLast(opArr.slice(0, opArr.length - 1));

        // Si paso de multi a division o viceversa
        if (
          lastOperator != button &&
          isIn(simple_operators, lastOperator) &&
          isIn(simple_operators, button)
        ) {
          if (isIn(simple_operators, preLastOperator)) {
            this.updOperation(
              `${this.operation.substring(0, this.operation.length - 1)}`
            );
          } else {
            this.updOperation((this.operation += button));
            this.updResult("0");
          }
        } else {
          this.updOperation(
            `${this.operation.substring(0, this.operation.length - 1)}${button}`
          );
        }
      } else {
        this.updOperation((this.operation += button));
        this.updResult("0");
      }
    }
    this.state = "writing";
  }

  handleFuncs(button) {
    // Dependiendo de la funcion hago lo que corresponda
    if (button == "DEL" && this.state == "writing") {
      if (this.result != "0" && this.result.length > 1) {
        console.log(
          this.operation,
          this.operation.substring(0, this.operation.length - 1)
        );
        this.updResult(this.result.substring(0, this.result.length - 1));
        this.updOperation(
          this.operation.substring(0, this.operation.length - 1)
        );
      } else if (this.result != 0 && this.result.length == 1) {
        this.updResult("0");
        this.updOperation(
          this.operation.substring(0, this.operation.length - 1)
        );
      }
      this.state = "writing";
    } else if (button == "CE") {
      if (this.result != "0") {
        var new_operation = this.operation.substring(
          0,
          this.operation.lastIndexOf(this.result)
        );
        this.updResult("0");
        this.updOperation(new_operation);

        this.state = "writing";
      }
    } else if (button == "C") {
      this.state = "writing";
      this.resetCalc();
    }
  }

  cleanText() {
    // Limpio el texto de la calculadora
    if (this.state == "writing") {
      this.result = "0";
    } else {
      this.resetCalc();
    }
  }

  resetCalc() {
    // Reseteo variables
    this.state = "writing";
    this.updResult("0");
    this.lastResult = 0;
    this.updOperation("");
  }

  handleOperation() {
    // Evaluo la operacion, devolviendo el resultado y la operacion en formato legible
    var operation = this.operation.replace(/÷/g, "/");
    var charList = operation.split("");
    var operation_text = "";
    charList.forEach((char, i) => {
      if (isIn(operators, char)) {
        operation_text += ` ${char} `;
      } else {
        operation_text += `${char}`;
      }
    });
    return {
      operation: operation_text.replace(/\//g, "÷"),
      result: isIn(operators, getLast(this.operation.split("")))
        ? null
        : eval(operation_text) + "",
    };
  }

  handleResult(result) {
    var text_result = result + "";
    // Busco puntos
    var dot_index = text_result.indexOf(".");
    var after_dot = "";
    var before_dot = text_result;

    // Separo entre antes y despues de los puntos
    if (dot_index != -1) {
      before_dot = text_result.substring(0, dot_index);
      after_dot = text_result.substring(dot_index + 1, text_result.length);
      if (after_dot.length > 5) {
        after_dot = after_dot.substring(0, 6);
      }
    }
    // Separo en miles
    var sections = [];
    if (before_dot.length > 3) {
      var last_index = before_dot.length;
      var section = before_dot.substring(last_index - 3, last_index);
      while (section.length == 3) {
        sections.push(section);
        last_index = last_index - 3;
        section = before_dot.substring(last_index - 3, last_index);
      }
      if (last_index > 0) {
        sections.push(before_dot.substring(0, last_index));
      }
    } else {
      sections = [before_dot];
    }
    sections = sections.reverse();

    // Uno las separaciones de los miles con una coma
    var final_result = sections.join(",");
    // Agrego decimales si los hay
    if (isIn(text_result, ".")) {
      final_result += `.${after_dot}`;
    }

    return final_result;
  }

  updateCalc() {
    // Evito calcular varias veces
    if (this.state == "showing_result" || !this.operation) {
      return;
    }
    var charList = this.operation.split("");
    if (isIn(operators, getLast(charList))) {
      this.operation = this.operation.substring(0, this.operation.length - 1);
    }
    var operation_data = this.handleOperation();
    //   Actualizo variables
    this.operation = "";
    this.lastResult = operation_data.result;
    this.operationDiv.innerHTML = "";
    this.updResult(operation_data.result);
    this.state = "showing_result";
  }
}

// Inicio la calculadora
const calc = new Calculator();

// Botones de minimizar y cerrar
const minimize = () => {
  currentWindow.minimize();
};
const close = () => {
  currentWindow.close();
};

const minimizeButton = document.getElementById("minimize");
minimizeButton.onclick = minimize;
const closeButton = document.getElementById("close");
closeButton.onclick = close;
