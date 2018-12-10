$(function () {
    const sides = {
        left: 1,
        right: 2,
        top: 3,
        bottom: 4
    };

    // игровой объект (родитель)
    class GameObject {
        constructor(cell) {
            this.cell = cell;
            cell.gameObject = this;
        }
    }

    // герой
    class Hero extends GameObject {
        draw() {
            return `<div class="hero"></div>`
        }
    }


    // преследователь
    class Pursuer extends GameObject {
        draw() {
            return `<div class="pursuer"></div>`
        }
    }


    // барьер
    class Barrier extends GameObject {
        draw() {
            return `<div class="barrier"></div>`
        }
    }


    // ячейка
    class Cell {
        constructor(row, column) {
            this.row = row;
            this.column = column;
            this.gameObj = null;
            this.htmlElement = document.createElement('div');
            this.htmlElement.setAttribute('id', `${this.row}-${this.column}`);
            this.htmlElement.setAttribute('class', 'cell');
        }

        get gameObject() {
            return this.gameObj;
        }

        set gameObject(gameObject) {
            this.gameObj = gameObject;
            this.draw();
        }

        draw() {
            this.htmlElement.innerHTML = (this.gameObject !== null ? this.gameObject.draw() : '');
        }
    }

    // игра
    class Game {
        // создание поля игры
        static generateField() {
            // console.log(this.config === Game.config); (true; везде статические методы, конфиг - стат. поле => контектом явл. не экз. класса, а сам класс)
            const size = this.config.fieldSize, field = []; // fieldSize === const {fieldSize} = this.config (альтернатива)

            for (let i = 0; i < size; i++) {
                field[i] = [];

                for (let j = 0; j < size; j++) {
                    field[i][j] = new Cell(i, j);
                }
            }

            return field;
        }

        // отрисовка поля
        static drawField(field) {
            const fieldElement = document.getElementById('field'),
                settingsElement = document.getElementById('settings');

            for (let key in Game.config) {
                const option = document.createElement('span');

                option.innerText = `${key}: ${Game.config[key]}`;
                option.setAttribute('id', `${key}`);
                settingsElement.appendChild(option);
            }

            fieldElement.setAttribute('style',
                `grid-template-rows: repeat(${Game.config.fieldSize}, 1fr);
                grid-template-columns: repeat(${Game.config.fieldSize}, 1fr)`);

            for (let i = 0; i < field.length; i++) {
                for (let j = 0; j < field.length; j++) {
                    fieldElement.appendChild(field[i][j].htmlElement);
                    field[i][j].draw();
                }
            }
        }

        // создание барьера
        static createBarriers(field) {
            this.calcPercent();

            for (let i = 0; i < this.calcPercent(); i++) {
                new Barrier(this.getEmptyRandomCell(field));
            }
        }

        // создание героя
        static createHero(field) {
            return new Hero(this.getEmptyRandomCell(field));
        }

        // создание преследователей
        static createPursuers(field) {
            const pursuer = [new Pursuer(this.getEmptyRandomCell(field))];

            for (let i = 1; i < this.config.pursuers; i++) {
                pursuer.push(new Pursuer(this.getEmptyRandomCell(field)));
            }

            return pursuer;
        }

        // движение (действие)
        static move(field, gameObject, row, column) {
            const newCell = field[row][column], oldCell = gameObject.cell;

            oldCell.gameObject = null;
            gameObject.cell = newCell;
            newCell.gameObject = gameObject;
        }

        // стратегия героя (пьяный алгоритм, так веселее)
        static heroStrategy(field, hero) {
            const row = hero.cell.row,
                column = hero.cell.column,
                emptySides = this.getEmptySides(field, row, column, true),
                max = emptySides.length,
                min = 0,
                side = emptySides[Math.floor(Math.random() * (max - min)) + min],
                newCoordinates = this.getCoordinatesBySide(side, row, column);

            this.move(field, hero, newCoordinates.newRow, newCoordinates.newColumn)
        }

        // стратегия преследователей
        static pursuerStrategy(field, pursuer, hero) {
            const rowPursuer = pursuer.cell.row,
                columnPursuer = pursuer.cell.column,
                bestSide = this.getBestSide(field, hero, pursuer),
                newCoordinates = this.getCoordinatesBySide(bestSide, rowPursuer, columnPursuer);

            this.move(field, pursuer, newCoordinates.newRow, newCoordinates.newColumn);
        }

        // лучшая сторона
        static getBestSide(field, hero, pursuer) {
            let rowPursuer = pursuer.cell.row,
                columnPursuer = pursuer.cell.column,
                rowHero = hero.cell.row,
                columnHero = hero.cell.column,
                rowDiff = rowHero - rowPursuer,
                columnDiff = columnHero - columnPursuer,
                emptySides = this.getEmptySides(field, pursuer.cell.row, pursuer.cell.column),
                heroSide;

            // когда в тупике
            if (emptySides.length === 1) {
                return emptySides[0];
            }

            if (columnDiff === 0) {
                heroSide = rowDiff > 0 ? sides.bottom : sides.top;

                if (emptySides.indexOf(heroSide) !== -1)
                    return heroSide;
            }

            if (rowDiff === 0) {
                heroSide = columnDiff > 0 ? sides.right : sides.left;

                if (emptySides.indexOf(heroSide) !== -1)
                    return heroSide;
            }

            const max = emptySides.length,
                min = 0;

            return emptySides[Math.floor(Math.random() * (max - min)) + min]
        }

        // стороны, в которые можно сходить
        static getEmptySides(field, row, column, hero) {
            const emptySides = [];

            for (let key in sides) {
                const newCoordinates = this.getCoordinatesBySide(sides[key], row, column);

                if (this.canGoToCell(field, newCoordinates.newRow, newCoordinates.newColumn, hero)) {
                    emptySides.push(sides[key]);
                }
            }

            return emptySides;
        }

        // выбор стороны
        static getCoordinatesBySide(side, row, column) {
            let newRow = row, newColumn = column;

            switch (side) {
                case sides.left:
                    newColumn--;
                    break;
                case sides.right:
                    newColumn++;
                    break;
                case sides.top:
                    newRow--;
                    break;
                case sides.bottom:
                    newRow++;
                    break;
            }

            return {newRow, newColumn};
        }

        // проверка клетки на пустоту и шаг героя навстречу преследователю
        static canGoToCell(field, row, column, hero) {
            // не вышел за границы массива
            if (row >= 0 && column >= 0 && row < field.length && column < field.length) {
                // герой не идет навстречу преследователям
                if (hero) {
                    return !(field[row][column].gameObject instanceof Barrier || field[row][column].gameObject instanceof Pursuer);
                }
                // нет барьера
                return !(field[row][column].gameObject instanceof Barrier || field[row][column].gameObject instanceof Pursuer);
            }
            else {
                return false;
            }
        }

        // нахождение процента (для барьеров)
        static calcPercent() {
            return Math.round(this.config.fieldSize * this.config.fieldSize / 100 * this.config.barriers);
        }

        // получение пустой случайной ячейки
        static getEmptyRandomCell(field) {
            const min = 0, max = field.length,
                getRandom = () => Math.floor(Math.random() * (max - min)) + min,
                cell = field[getRandom()][getRandom()];

            if (cell.gameObject === null) {
                return cell;
            }
            else {
                // наличие пустой ячейки
                if (!field.some((cellArray) => cellArray.some(cell => cell.gameObject === null))) {
                    return null;
                }

                return this.getEmptyRandomCell(field);
            }
        }
    }

    // настройки игры
    Game.config = {
        fieldSize: 10, // (^2) размер поля (кол-во ячеек)
        barriers: 15, // (<= 10%) кол-во барьеров
        pursuers: 2, // (<= 3) кол-во преследователей
        speed: 500 // (мс.) скорость игры
    };

    // создание поля игры
    const field = Game.generateField();

    // создание объектов
    Game.createBarriers(field);
    const hero = Game.createHero(field),
        pursuers = Game.createPursuers(field);

    // отрисовка объектов
    Game.drawField(field);

    // стратегия движения (герой, преследователи)
    let count = 0;
    const counter = document.getElementById('counter'),
        timerId = setInterval(() => {
            Game.heroStrategy(field, hero, pursuers);
            count++;
            counter.innerHTML = count.toString();

            for (let i = 0; i < pursuers.length; i++) {
                Game.pursuerStrategy(field, pursuers[i], hero);

                if (hero.cell.row === pursuers[i].cell.row && hero.cell.column === pursuers[i].cell.column) {
                    clearInterval(timerId);

                    setTimeout(() => {
                        alert('shrek: myyy!');
                    }, Game.config.speed);

                    break;
                }
            }
        }, Game.config.speed);
});