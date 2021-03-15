const contentNode = document.querySelector('#content');

const table = {
    node: document.createElement('table'),
    name: document.createElement('input'),
    thead: document.createElement('thead'),
    tbody: document.createElement('tbody'),
    hasHeaders: false
}

let result;
let numberCols;

const upload = document.querySelector('input[type="file"]');
upload.addEventListener('change', function () {
    const reader = new FileReader();
    reader.onload = function (e) {
        result = e.target.result.split('\n');
        numberCols = result[0].split(',').length;

        createConstraints();
        createTable();

        table.name.type = 'text';
        table.name.placeholder = 'table name';
        contentNode.appendChild(table.name);

        const submit = document.createElement('button');
        submit.type = 'button';
        submit.textContent = 'process!';
        submit.addEventListener('click', generateSQL);
        contentNode.appendChild(submit);
    }
    reader.readAsText(upload.files[0]);
});

function createConstraints() {
    const constraints = ['PRIMARY KEY', 'NULL', 'NOT NULL', 'UNIQUE'];

    for (let i = -1; i < constraints.length; i++) {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.textContent = constraints[i];
        row.appendChild(label);

        if (i !== -1) {
            for (let j = 0; j < numberCols; j++) {
                const cell = document.createElement('th');
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'col' + (j + 1);
                cell.appendChild(input);
                row.appendChild(cell);
            }

            const cell = document.createElement('th');
            const input = document.createElement('input');
            input.type = 'checkbox';
            cell.appendChild(input);
            row.appendChild(cell);
        } else {
            for (let j = 0; j < numberCols + 1; j++) {
                const label = document.createElement('th');
                if (j === numberCols)
                    label.textContent = 'AUTO_INCREMENT';
                row.appendChild(label);
            }
        }

        table.thead.appendChild(row);
    }
}

function createTable() {
    table.hasHeaders = document.querySelector('input[type="checkbox"]').checked;

    createInputRow('dataType', 'data type');

    if (!table.hasHeaders) {
        createInputRow('columName', 'colum name');
    }

    for (let i = 0; i < result.length; i++) {
        result[i] = result[i].split(',');
        const row = document.createElement('tr');
        row.appendChild(document.createElement((i === 0 && table.hasHeaders) ? 'th' : 'td'));
        for (let j = 0; j < result[i].length; j++) {
            const cell = document.createElement((i === 0 && table.hasHeaders) ? 'th' : 'td');
            cell.textContent = result[i][j];
            row.appendChild(cell);
        }
        ((i === 0 && table.hasHeaders) ? table.thead : table.tbody).appendChild(row);
    }

    table.node.appendChild(table.thead);
    table.node.appendChild(table.tbody);

    contentNode.innerHTML = '';
    contentNode.appendChild(table.node);
}

function createInputRow(name, placeholder) {
    const row = document.createElement('tr');
    row.appendChild(document.createElement('th'));
    for (let i = 0; i < numberCols; i++) {
        const cell = document.createElement('th');
        const input = document.createElement('input');
        input.name = name;
        input.placeholder = placeholder;
        cell.appendChild(input);
        row.appendChild(cell);
    }

    table.thead.appendChild(row);
}

function generateSQL() {
    const structure = {
        columns: [],
        dataTypes: [],
        constraints: [],
        content: []
    }

    const columnNodes = table.thead.querySelectorAll('tr:last-of-type th');
    for (let i = 0; i < columnNodes.length; i++) {
        if (table.hasHeaders && columnNodes[i].textContent) {
            structure.columns.push(columnNodes[i].textContent);
        } else if (columnNodes[i].querySelector('input')) {
            structure.columns.push(columnNodes[i].querySelector('input').value);
        }
    }

    const dataTypeNodes = table.thead.querySelectorAll('input[name="dataType"]');
    for (let i = 0; i < dataTypeNodes.length; i++) {
        structure.dataTypes.push(dataTypeNodes[i].value);
    }

    const constraintNodes = table.thead.querySelectorAll('th:first-of-type');
    for (let i = 0; i < constraintNodes.length; i++) {
        if (constraintNodes[i].textContent)
            structure.constraints.push(constraintNodes[i].textContent);
    }

    const textarea = document.createElement('textarea');
    textarea.textContent = 'CREATE TABLE `' + table.name.value + '` (';
    for (let i = 0; i < structure.columns.length; i++) {
        textarea.textContent += ('\n\t`' + structure.columns[i] + '`');
        textarea.textContent += (' ' + structure.dataTypes[i]);
        const radios = document.querySelectorAll(`[name="col${i + 1}"]`);
        for (let j = 0; j < radios.length; j++) {
            if (radios[j].checked)
                textarea.textContent += (' ' + structure.constraints[j]);
        }
        const checkbox = document.querySelector(`tr:nth-of-type(${i + 2}) input[type="checkbox"]`);
        if(checkbox && checkbox.checked) {
            textarea.textContent += (' AUTO_INCREMENT');
        }
        if (i !== structure.columns.length - 1)
            textarea.textContent += ',';
    }
    textarea.textContent += '\n);\n\n';

    textarea.textContent += 'INSERT INTO `' + table.name.value + '` VALUES';
    for (let i = ((table.hasHeaders) ? 1 : 0); i < result.length; i++) {
        textarea.textContent += '\n\t';
        for (let j = 0; j < result[i].length; j++) {
            if (j === 0)
                textarea.textContent += '(';
            textarea.textContent += `"${result[i][j]}"`;
            if (j !== result[i].length - 1) {
                textarea.textContent += ', ';
            } else if (i === result.length - 1) {
                textarea.textContent += ');';
            } else {
                textarea.textContent += '),';
            }
        }
    }

    contentNode.innerHTML = '';
    contentNode.appendChild(textarea);
}