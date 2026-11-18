"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, MapPin, Pencil, Plus, Power, PowerOff, Save, ShieldCheck, ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SelectField, TextField } from "@/components/ui/Form";
import { KycImageField } from "@/features/onboarding/member-kyc/components/KycImageField";
import { LocationMapPicker } from "@/features/onboarding/member-location/components/LocationMapPicker";
import { showToast } from "@/components/ui/toast";
import { fetchApplOptions } from "@/features/master/appl-options/services/appl-options-client";
import { fetchStates } from "@/features/master/organization/services/organization-client";
import type { Member } from "@/features/onboarding/member-registration/types/member.types";
import { coordinateError, normalizePin, pinError } from "@/features/onboarding/member-location/lib/location-rules";
import {
  addMemberLocations,
  changeMemberLocationStatus,
  editMemberLocation,
  fetchMemberLocations,
  geoVerifyMemberLocation,
  isMemberLocationClientError,
} from "@/features/onboarding/member-location/services/member-location-client";
import type { LocationDraftInput, MemberLocation } from "@/features/onboarding/member-location/types/member-location.types";

type Draft = {
  key: string;
  memberLocId?: number;
  addTypeCd: string;
  addressLine1: string;
  addressLine2: string;
  village: string;
  gramPanchayat: string;
  blockName: string;
  districtName: string;
  stateCd: string;
  pinCode: string;
  latitude: string;
  longitude: string;
  photoPath: string;
};

const emptyDraft = (): Draft => ({
  key: crypto.randomUUID(),
  addTypeCd: "",
  addressLine1: "",
  addressLine2: "",
  village: "",
  gramPanchayat: "",
  blockName: "",
  districtName: "",
  stateCd: "",
  pinCode: "",
  latitude: "",
  longitude: "",
  photoPath: "",
});

function fromLocation(item: MemberLocation): Draft {
  return {
    key: String(item.memberLocId),
    memberLocId: item.memberLocId,
    addTypeCd: String(item.addTypeCd),
    addressLine1: item.addressLine1,
    addressLine2: item.addressLine2 ?? "",
    village: item.village ?? "",
    gramPanchayat: item.gramPanchayat ?? "",
    blockName: item.blockName ?? "",
    districtName: item.districtName,
    stateCd: String(item.stateCd),
    pinCode: item.pinCode,
    latitude: item.latitude == null ? "" : String(item.latitude),
    longitude: item.longitude == null ? "" : String(item.longitude),
    photoPath: item.photoPath ?? "",
  };
}

function toInput(draft: Draft): LocationDraftInput {
  const lat = draft.latitude.trim();
  const lng = draft.longitude.trim();
  return {
    addTypeCd: Number(draft.addTypeCd),
    addressLine1: draft.addressLine1.trim(),
    addressLine2: draft.addressLine2.trim() || null,
    village: draft.village.trim() || null,
    gramPanchayat: draft.gramPanchayat.trim() || null,
    blockName: draft.blockName.trim() || null,
    districtName: draft.districtName.trim(),
    stateCd: Number(draft.stateCd),
    pinCode: normalizePin(draft.pinCode),
    latitude: lat ? Number(lat) : null,
    longitude: lng ? Number(lng) : null,
    photoPath: draft.photoPath || null,
  };
}

export function MemberLocationModal({
  member,
  open,
  onClose,
}: {
  member: Member | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("onboarding.memberLocation");
  const [items, setItems] = useState<MemberLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<{ value: string; label: string; id: string }[]>([]);
  const [states, setStates] = useState<{ value: string; label: string; id: string }[]>([]);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const locked = member?.statusCd === 4 || member?.statusCd === 5;

  useEffect(() => {
    if (!open) return;
    setDrafts(null);
    setFieldError("");
    fetchApplOptions(33)
      .then((options) =>
        setTypes(
          options
            .filter((option) => option.optGroup === "Address Type" && option.isActive)
            .map((option) => ({
              value: String(option.optCode),
              label: option.optDescription,
              id: String(option.optionId),
            })),
        ),
      )
      .catch(() => setTypes([]));
    fetchStates({ page: 1, perPage: 200 })
      .then((result) =>
        setStates(
          result.items.map((state) => ({
            value: String(state.stateCd),
            label: state.stateName,
            id: String(state.stateCd),
          })),
        ),
      )
      .catch(() => setStates([]));
  }, [open]);

  useEffect(() => {
    if (!open || !member) return;
    const controller = new AbortController();
    setLoading(true);
    fetchMemberLocations(
      {
        memberId: member.memberId,
        page: 1,
        perPage: 50,
        isActive: showInactive ? undefined : true,
      },
      controller.signal,
    )
      .then((result) => setItems(result.items))
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, member, reloadKey, showInactive]);

  function saved(message: string) {
    if (message) showToast(message, "success");
    setDrafts(null);
    setFieldError("");
    setReloadKey((value) => value + 1);
  }

  function validate(rows: Draft[]): string | null {
    for (const [index, row] of rows.entries()) {
      const prefix = rows.length > 1 ? t("rowLabel", { index: index + 1 }) : "";
      const withPrefix = (message: string) => (prefix ? `${prefix} ${message}` : message);
      if (!row.addTypeCd) return withPrefix(t("typeRequired"));
      if (!row.addressLine1.trim()) return withPrefix(t("line1Required"));
      if (row.addressLine1.trim().length > 200) return withPrefix(t("line1Required"));
      if (!row.districtName.trim()) return withPrefix(t("districtRequired"));
      if (!row.stateCd) return withPrefix(t("stateRequired"));
      const pin = pinError(row.pinCode);
      if (pin) return withPrefix(t("pinInvalid"));
      const coordinates = coordinateError(row.latitude, row.longitude);
      if (coordinates === "together") return withPrefix(t("coordinatesTogether"));
      if (coordinates === "india") return withPrefix(t("coordinatesIndia"));
      if (row.photoPath.length > 300) return withPrefix(t("photoTooLong"));
    }
    return null;
  }

  async function submitForm() {
    if (!member || !drafts) return;
    const error = validate(drafts);
    if (error) {
      setFieldError(error);
      return;
    }
    setSaving(true);
    setFieldError("");
    try {
      const editing = drafts.length === 1 ? drafts[0].memberLocId : undefined;
      if (editing) {
        const result = await editMemberLocation({ memberLocId: editing, ...toInput(drafts[0]) });
        saved(result.message);
      } else {
        const result = await addMemberLocations({
          memberId: member.memberId,
          locations: drafts.map(toInput),
        });
        saved(result.message);
      }
    } catch (caught) {
      setFieldError(isMemberLocationClientError(caught) ? caught.message : t("requestFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function verify(item: MemberLocation, next: boolean) {
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (next && !item.hasCoordinates && navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }
      const result = await geoVerifyMemberLocation({
        memberLocId: item.memberLocId,
        geoVerified: next,
        latitude,
        longitude,
      });
      saved(result.message);
    } catch (caught) {
      showToast(isMemberLocationClientError(caught) ? caught.message : t("requestFailed"), "error");
    }
  }

  async function toggle(item: MemberLocation) {
    try {
      const result = await changeMemberLocationStatus({ memberLocId: item.memberLocId, isActive: !item.isActive });
      saved(result.message);
    } catch (caught) {
      showToast(isMemberLocationClientError(caught) ? caught.message : t("requestFailed"), "error");
    }
  }

  function updateDraft(key: string, patch: Partial<Draft>) {
    setDrafts((current) => current?.map((row) => (row.key === key ? { ...row, ...patch } : row)) ?? current);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t("title", { name: member?.memberName ?? "" })}
      subtitle={member?.refCode ?? undefined}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("close")}
        </Button>
      }
    >
      <div className="space-y-4">
        {locked ? <p className="text-sm text-amber-800">{t("memberLocked")}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input autoComplete="off"
              type="checkbox"
              className="h-4 w-4 accent-brand"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            {t("showInactive")}
          </label>
          <Button
            type="button"
            icon={Plus}
            disabled={locked}
            onClick={() => {
              setDrafts([emptyDraft()]);
              setFieldError("");
            }}
          >
            {t("addAddress")}
          </Button>
        </div>

        {drafts && member ? (
          <div className="space-y-4 rounded-xl border border-border p-3">
            <p className="text-sm font-semibold text-slate-900">
              {drafts[0]?.memberLocId ? t("editAddress") : t("addAddress")}
            </p>
            {drafts.map((draft, index) => (
              <div key={draft.key} className="grid gap-3 sm:grid-cols-2">
                {drafts.length > 1 ? (
                  <div className="sm:col-span-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">{t("rowLabel", { index: index + 1 })}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDrafts(drafts.filter((row) => row.key !== draft.key))}
                    >
                      {t("removeRow")}
                    </Button>
                  </div>
                ) : null}
                <SelectField
                  label={t("addressType")}
                  required
                  placeholder={t("addressType")}
                  searchable={false}
                  value={draft.addTypeCd}
                  onChange={(value) => updateDraft(draft.key, { addTypeCd: value })}
                  options={types}
                />
                <SelectField
                  label={t("state")}
                  required
                  placeholder={t("state")}
                  value={draft.stateCd}
                  onChange={(value) => updateDraft(draft.key, { stateCd: value })}
                  options={states}
                />
                <TextField
                  label={t("line1")}
                  required
                  className="sm:col-span-2"
                  value={draft.addressLine1}
                  placeholder={t("line1Placeholder")}
                  maxLength={200}
                  onChange={(value) => updateDraft(draft.key, { addressLine1: value })}
                />
                <TextField
                  label={t("line2")}
                  className="sm:col-span-2"
                  value={draft.addressLine2}
                  placeholder={t("line2Placeholder")}
                  maxLength={200}
                  onChange={(value) => updateDraft(draft.key, { addressLine2: value })}
                />
                <TextField label={t("village")} value={draft.village} maxLength={100} placeholder={t("village")} onChange={(value) => updateDraft(draft.key, { village: value })} />
                <TextField label={t("gramPanchayat")} value={draft.gramPanchayat} maxLength={100} placeholder={t("gramPanchayat")} onChange={(value) => updateDraft(draft.key, { gramPanchayat: value })} />
                <TextField label={t("block")} value={draft.blockName} maxLength={100} placeholder={t("block")} onChange={(value) => updateDraft(draft.key, { blockName: value })} />
                <TextField label={t("district")} required value={draft.districtName} maxLength={100} placeholder={t("district")} onChange={(value) => updateDraft(draft.key, { districtName: value })} />
                <TextField label={t("pin")} required value={draft.pinCode} placeholder="700135" inputMode="numeric" restrict="digits" maxLength={6} onChange={(value) => updateDraft(draft.key, { pinCode: value })} />
                <LocationMapPicker
                  latitude={draft.latitude}
                  longitude={draft.longitude}
                  addressQuery={[
                    draft.addressLine1,
                    draft.village,
                    draft.gramPanchayat,
                    draft.blockName,
                    draft.districtName,
                    states.find((state) => state.value === draft.stateCd)?.label ?? "",
                    normalizePin(draft.pinCode),
                  ]
                    .map((part) => part.trim())
                    .filter(Boolean)
                    .join(", ")}
                  onChange={(lat, lng) => updateDraft(draft.key, { latitude: lat, longitude: lng })}
                />
                <div className="sm:col-span-2">
                  <KycImageField
                    label={t("photo")}
                    memberId={member.memberId}
                    value={draft.photoPath}
                    fileUrl="/api/onboarding/member-location/file"
                    onChange={(path) => updateDraft(draft.key, { photoPath: path })}
                  />
                </div>
              </div>
            ))}
            {fieldError ? <p className="text-sm text-rose-700">{fieldError}</p> : null}
            <div className="flex flex-wrap justify-end gap-2">
              {!drafts[0]?.memberLocId && drafts.length < 5 ? (
                <Button type="button" variant="secondary" onClick={() => setDrafts([...drafts, emptyDraft()])}>
                  {t("addAnother")}
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={() => setDrafts(null)}>
                {t("cancel")}
              </Button>
              <Button type="button" icon={Save} loading={saving} onClick={() => void submitForm()}>
                {t("save")}
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            className="rounded-xl border border-dashed border-border"
            icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
            title={t("empty")}
            message={t("emptyHint")}
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.memberLocId} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand" />
                      <p className="text-sm font-semibold text-slate-900">{item.addTypeDesc || t("addressType")}</p>
                      <Badge tone={item.isActive ? "success" : "neutral"} caps={false}>
                        {item.isActive ? t("active") : t("inactive")}
                      </Badge>
                      <Badge tone={item.geoVerified ? "success" : "warning"} caps={false}>
                        {item.geoVerified ? t("verified") : t("notVerified")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{item.fullAddress || item.addressLine1}</p>
                    {item.geoVerifiedByName ? (
                      <p className="mt-1 text-xs text-muted">
                        {t("verifiedBy", { name: item.geoVerifiedByName, date: item.geoVerifiedDate ?? "" })}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.mapUrl ? (
                      <a
                        href={item.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("map")}
                      </a>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      icon={Pencil}
                      disabled={locked || !item.isActive}
                      onClick={() => {
                        setDrafts([fromLocation(item)]);
                        setFieldError("");
                      }}
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={item.geoVerified ? "amber" : "success"}
                      icon={item.geoVerified ? ShieldOff : ShieldCheck}
                      disabled={locked || !item.isActive}
                      onClick={() => void verify(item, !item.geoVerified)}
                    >
                      {item.geoVerified ? t("clearVerification") : t("verify")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={item.isActive ? "warning" : "success"}
                      icon={item.isActive ? PowerOff : Power}
                      disabled={locked}
                      onClick={() => void toggle(item)}
                    >
                      {item.isActive ? t("deactivate") : t("activate")}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
