/**
 * El tab bar es flotante y absoluto (no ocupa espacio en el layout), así
 * que cada pantalla dentro de los tabs tiene que dejar este colchón extra
 * de padding abajo o el último elemento queda tapado por la barra.
 * Generoso a propósito: cubre bar + safe area en la mayoría de los
 * dispositivos sin tener que calcular insets pantalla por pantalla.
 */
export const TAB_BAR_CLEARANCE = 130;
