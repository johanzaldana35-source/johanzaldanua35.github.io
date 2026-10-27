
const productos = {
    P001: { nombre: "Pupusa", precio: 0.75 },
    P002: { nombre: "Hamburguesa", precio: 2.50 },
    P003: { nombre: "Pizza", precio: 2.00 },
    P004: { nombre: "Taco", precio: 1.50 },
    P005: { nombre: "Jugo", precio: 1.00 },
    P006: { nombre: "Agua", precio: 0.75 }
};

let pedidos = [];
let siguienteCodigo = 1;

const formulario = document.getElementById("formPedido");
const clienteInput = document.getElementById("cliente");
const productoInput = document.getElementById("producto");
const cantidadInput = document.getElementById("cantidad");
const pagoInput = document.getElementById("pago");

const precioTexto = document.getElementById("precio");
const subtotalTexto = document.getElementById("subtotal");
const descuentoTexto = document.getElementById("descuento");
const totalTexto = document.getElementById("total");
const mensaje = document.getElementById("mensaje");

function dinero(valor) {
    return "$" + valor.toFixed(2);
}

function calcularPedido() {
    const producto = productos[productoInput.value];
    const cantidad = Math.max(1, Number(cantidadInput.value) || 1);

    const subtotal = producto.precio * cantidad;
    const descuento = cantidad >= 5 ? subtotal * 0.10 : 0;
    const total = subtotal - descuento;

    precioTexto.textContent = dinero(producto.precio);
    subtotalTexto.textContent = dinero(subtotal);
    descuentoTexto.textContent = dinero(descuento);
    totalTexto.textContent = dinero(total);

    return { producto, cantidad, subtotal, descuento, total };
}

productoInput.addEventListener("change", calcularPedido);
cantidadInput.addEventListener("input", calcularPedido);

formulario.addEventListener("submit", function(evento) {
    evento.preventDefault();

    const cliente = clienteInput.value.trim();
    const cantidad = Number(cantidadInput.value);

    if (!cliente) {
        mostrarMensaje("Escribe el nombre del cliente.", true);
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad < 1) {
        mostrarMensaje("La cantidad debe ser un número entero mayor que cero.", true);
        return;
    }

    const calculo = calcularPedido();

    const pedido = {
        codigo: String(siguienteCodigo).padStart(3, "0"),
        cliente: cliente,
        producto: calculo.producto.nombre,
        cantidad: calculo.cantidad,
        precio: calculo.producto.precio,
        subtotal: calculo.subtotal,
        descuento: calculo.descuento,
        total: calculo.total,
        pago: pagoInput.value
    };

    pedidos.push(pedido);
    siguienteCodigo++;

    mostrarDetalle(pedido);
    actualizarResumen();
    mostrarMensaje("¡Pedido registrado correctamente!", false);

    // Limpiar el formulario para el siguiente pedido.
    clienteInput.value = "";
    cantidadInput.value = "1";
    productoInput.value = "P001";
    pagoInput.value = "Efectivo";

    calcularPedido();
});

function mostrarMensaje(texto, esError) {
    mensaje.textContent = texto;
    mensaje.className = esError ? "error" : "exito";
}

function mostrarDetalle(pedido) {
    document.getElementById("detallePedido").innerHTML = `
        <h3>════════ PEDIDO REGISTRADO ════════</h3>
        <p><strong>Código:</strong> ${pedido.codigo}</p>
        <p><strong>Cliente:</strong> ${escaparHTML(pedido.cliente)}</p>
        <p><strong>Producto:</strong> ${pedido.producto}</p>
        <p><strong>Cantidad:</strong> ${pedido.cantidad}</p>
        <p><strong>Precio:</strong> ${dinero(pedido.precio)}</p>
        <p><strong>Subtotal:</strong> ${dinero(pedido.subtotal)}</p>
        <p><strong>Descuento:</strong> ${dinero(pedido.descuento)}</p>
        <p class="total">TOTAL: ${dinero(pedido.total)}</p>
        <p><strong>Pago:</strong> ${pedido.pago}</p>
    `;
}

function escaparHTML(texto) {
    return texto.replace(/[&<>"']/g, function(caracter) {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entidades[caracter];
    });
}

function actualizarResumen() {
    const ventas = pedidos.reduce(
        (acumulado, pedido) => acumulado + pedido.total,
        0
    );

    document.getElementById("numeroPedidos").textContent = pedidos.length;
    document.getElementById("ventas").textContent = dinero(ventas);
}

function pedidoATXT(pedido) {
    return [
        pedido.codigo,
        pedido.cliente,
        pedido.producto,
        pedido.cantidad,
        pedido.precio.toFixed(2),
        pedido.subtotal.toFixed(2),
        pedido.descuento.toFixed(2),
        pedido.total.toFixed(2),
        pedido.pago
    ].join("|");
}

function descargarTXT() {
    const contenido = pedidos.map(pedidoATXT).join("\n");

    const archivo = new Blob(
        [contenido ? contenido + "\n" : ""],
        { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "pedidos.txt";
    enlace.click();

    URL.revokeObjectURL(url);
}

document.getElementById("btnGuardar").addEventListener("click", function() {
    descargarTXT();
});

document.getElementById("btnCargar").addEventListener("click", async function() {
    const archivo = document.getElementById("archivoTXT").files[0];

    if (!archivo) {
        mostrarMensaje("Primero selecciona el archivo pedidos.txt.", true);
        return;
    }

    try {
        const contenido = await archivo.text();

        const registros = contenido.split(/\r?\n/).filter(linea => linea.trim());

        const pedidosLeidos = [];

        for (const registro of registros) {
            const campos = registro.split("|");

            if (campos.length !== 9) {
                throw new Error("Hay un registro con formato incorrecto.");
            }

            const [
                codigo, cliente, producto, cantidad, precio,
                subtotal, descuento, total, pago
            ] = campos;

            const numeros = [cantidad, precio, subtotal, descuento, total];

            if (
                !codigo.trim() ||
                !cliente.trim() ||
                !producto.trim() ||
                !pago.trim() ||
                numeros.some(valor => valor.trim() === "" || !Number.isFinite(Number(valor))) ||
                !Number.isInteger(Number(cantidad)) ||
                Number(cantidad) < 1
            ) {
                throw new Error("Hay datos inválidos en el archivo TXT.");
            }

            pedidosLeidos.push({
                codigo,
                cliente,
                producto,
                cantidad: Number(cantidad),
                precio: Number(precio),
                subtotal: Number(subtotal),
                descuento: Number(descuento),
                total: Number(total),
                pago
            });
        }

        pedidos = pedidosLeidos;

        const mayorCodigo = pedidos.reduce((mayor, pedido) => {
            const numero = Number(pedido.codigo);
            return Number.isInteger(numero) ? Math.max(mayor, numero) : mayor;
        }, 0);

        siguienteCodigo = mayorCodigo + 1;

        mostrarTabla();
        actualizarResumen();
        mostrarMensaje("Pedidos cargados correctamente.", false);

        if (pedidos.length > 0) {
            mostrarDetalle(pedidos[pedidos.length - 1]);
        } else {
            document.getElementById("detallePedido").textContent =
                "El archivo no contiene pedidos.";
        }
    } catch (error) {
        mostrarMensaje("No se pudo leer el archivo: " + error.message, true);
    }
});

function mostrarTabla() {
    const tabla = document.getElementById("tablaPedidos");
    tabla.replaceChildren();

    if (pedidos.length === 0) {
        const fila = tabla.insertRow();
        const celda = fila.insertCell();
        celda.colSpan = 5;
        celda.textContent = "No hay pedidos registrados.";
        return;
    }

    pedidos.forEach(pedido => {
        const fila = tabla.insertRow();

        [
            pedido.codigo,
            pedido.cliente,
            pedido.producto,
            pedido.cantidad,
            dinero(pedido.total)
        ].forEach(valor => {
            const celda = fila.insertCell();
            celda.textContent = valor;
        });
    });
}

calcularPedido();
