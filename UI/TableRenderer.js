// UI/TableRenderer.js

export default class TableRenderer {
    constructor(tbodyId = "table-body") {
        this.tbody = document.getElementById(tbodyId);
    }

    render(cradle) {
        if (!this.tbody) return;
        const rowsHtml = cradle.balls.map((ball, index) => {
            return `
                <tr>
                    <td><b>#${index}</b></td>
                    <td class="col-angle">${ball.theta.toFixed(3)}</td>
                    <td class="col-omega">${ball.omega.toFixed(3)}</td>
                    <td class="col-x">${ball.x.toFixed(3)}</td>
                    <td class="col-y">${ball.y.toFixed(3)}</td>
                    <td class="col-ek">${ball.kineticEnergy.toFixed(4)}</td>
                    <td class="col-ep">${ball.getPotentialEnergy(cradle.g).toFixed(4)}</td>
                    <td class="col-et">${ball.getTotalEnergy(cradle.g).toFixed(4)}</td>
                </tr>
            `;
        }).join('');
        this.tbody.innerHTML = rowsHtml;
    }
}