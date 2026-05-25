const isEditable = (idEstado) => {
    // 3: Cancelada, 4: Finalizada
    const BLOCKED_STATES = [3, 4]; 
    return !BLOCKED_STATES.includes(idEstado);
};

module.exports = { isEditable };