// apps/api/src/modules/upgrades/dto/list-upgrades.dto.ts
// DTO ��� ������ ������ � ����� ������ ���� ������.

export type UpgradeListItem = {
    id: string;
    code: string;
    title: string;
    description?: string | null;
    priceCoins: number;
    maxLevel: number;
    effectType: string;
    effectValue: number;
    // ������������ ������ ������:
    level: number;        // ������� ������� (0 ���� �� �������)
    canBuy: boolean;      // ������� �� ����� ������
    nextPrice: number;    // ���� �� ��������� ������� (���� � ���� ������������ ���� � ����� ��������������)
};

export type UpgradeListResponse = {
    upgrades: UpgradeListItem[];
    coins: number; // ������� ����� � ������ ������ (��� �������� UI)
};
