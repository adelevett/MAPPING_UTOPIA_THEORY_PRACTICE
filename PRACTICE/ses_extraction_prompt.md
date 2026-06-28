# Extraction Prompt: Rob Hopkins Blog Post → Ostrom SES Schema

## System Instruction

You are a structured data extraction assistant. Your task is to extract information from a blog post written by Rob Hopkins and populate Elinor Ostrom's Social-Ecological Systems (SES) framework schema.

You must follow these rules without exception:

1. **Faithfulness**: Only populate a field if the source text explicitly contains information that supports it. Do not infer, assume, or complete fields from general world knowledge.
2. **Evidence required**: For every field you populate with a non-null value, you must provide a direct quote or close paraphrase from the source text in the `evidence` field.
3. **Null is correct**: If the source text does not contain information relevant to a field, set both `value` and `evidence` to `null`. A mostly-null response is expected and acceptable — Hopkins' blog posts will not contain information relevant to all SES fields.
4. **No invention**: If you are uncertain whether a passage supports a field, leave it null. Do not guess.
5. **Exhaustive Multi-Practice Extraction**: Extract *every* distinct localized practice, community project, cooperative, festival, or group described in the post. Create a separate entry in the `practices` array for each. If the post contains no specific localized practices, return an empty `practices` array.
6. **Temporal Nature Classification**: For each practice, you must classify its temporal nature in the `temporal_nature.value` field as one of:
   *   `ephemeral`: One-off events, temporary actions, flash mobs, or singular festivals (e.g., a 1-day festival or flash mob).
   *   `seasonal`: Recurring periodically, annually, or seasonally (e.g., a recurring summer solstice council).
   *   `persistent`: Ongoing, long-lasting, or permanent organizations, infrastructures, local currencies, or physical sites (e.g., a restaurant, a co-op, an eco retreat).
   Provide a brief reasoning in the `explanation` field and the supporting direct quote in `evidence`.

---

## Schema Reference

Each field in a practice object follows this structure:
```json
{ "value": "<extracted value or null>", "evidence": "<direct quote or paraphrase from source, or null>" }
```

The fields are organised into Ostrom's eight top-level SES components:
- **S**: Social, economic and political settings (S1–S6)
- **RS**: Resource systems (RS1–RS9)
- **RU**: Resource units (RU1–RU7)
- **GS**: Governance systems (GS1–GS8)
- **U**: Users (U1–U9)
- **I**: Interactions (I1–I8)
- **O**: Outcomes (O1–O3)
- **ECO**: Related ecosystems (ECO1–ECO3)

---

## Task

Given the blog post below, return a single valid JSON object conforming to the schema. Do not include any text outside the JSON object.

**Post ID**: {POST_ID}
**URL**: {POST_URL}
**Title**: {POST_TITLE}
**Date**: {POST_DATE}

**Content**:
{POST_CONTENT}

---

## Output

Return only the following JSON, with the `practices` array populated for all distinct practices:

```json
{
  "post_id": {POST_ID},
  "url": "{POST_URL}",
  "title": "{POST_TITLE}",
  "date": "{POST_DATE}",
  "practices": [
    {
      "practice_name": "Name of the practice",
      "location": { "value": "Location string", "evidence": "Direct quote" },
      "temporal_nature": {
        "value": "ephemeral | seasonal | persistent",
        "explanation": "Brief explanation of the choice",
        "evidence": "Direct quote"
      },
      "social_economic_political_settings": {
        "S1_economic_development": { "value": null, "evidence": null },
        "S2_demographic_trends": { "value": null, "evidence": null },
        "S3_political_stability": { "value": null, "evidence": null },
        "S4_government_resource_policies": { "value": null, "evidence": null },
        "S5_market_incentives": { "value": null, "evidence": null },
        "S6_media_organization": { "value": null, "evidence": null }
      },
      "resource_systems": {
        "RS1_sector": { "value": null, "evidence": null },
        "RS2_clarity_of_system_boundaries": { "value": null, "evidence": null },
        "RS3_size_of_resource_system": { "value": null, "evidence": null },
        "RS4_human_constructed_facilities": { "value": null, "evidence": null },
        "RS5_productivity_of_system": { "value": null, "evidence": null },
        "RS6_equilibrium_properties": { "value": null, "evidence": null },
        "RS7_predictability_of_system_dynamics": { "value": null, "evidence": null },
        "RS8_storage_characteristics": { "value": null, "evidence": null },
        "RS9_location": { "value": null, "evidence": null }
      },
      "resource_units": {
        "RU1_resource_unit_mobility": { "value": null, "evidence": null },
        "RU2_growth_or_replacement_rate": { "value": null, "evidence": null },
        "RU3_interaction_among_resource_units": { "value": null, "evidence": null },
        "RU4_economic_value": { "value": null, "evidence": null },
        "RU5_number_of_units": { "value": null, "evidence": null },
        "RU6_distinctive_markings": { "value": null, "evidence": null },
        "RU7_spatial_and_temporal_distribution": { "value": null, "evidence": null }
      },
      "governance_systems": {
        "GS1_government_organizations": { "value": null, "evidence": null },
        "GS2_nongovernment_organizations": { "value": null, "evidence": null },
        "GS3_network_structure": { "value": null, "evidence": null },
        "GS4_property_rights_systems": { "value": null, "evidence": null },
        "GS5_operational_rules": { "value": null, "evidence": null },
        "GS6_collective_choice_rules": { "value": null, "evidence": null },
        "GS7_constitutional_rules": { "value": null, "evidence": null },
        "GS8_monitoring_and_sanctioning_processes": { "value": null, "evidence": null }
      },
      "users": {
        "U1_number_of_users": { "value": null, "evidence": null },
        "U2_socioeconomic_attributes_of_users": { "value": null, "evidence": null },
        "U3_history_of_use": { "value": null, "evidence": null },
        "U4_location": { "value": null, "evidence": null },
        "U5_leadership_entrepreneurship": { "value": null, "evidence": null },
        "U6_norms_social_capital": { "value": null, "evidence": null },
        "U7_knowledge_of_SES_mental_models": { "value": null, "evidence": null },
        "U8_importance_of_resource": { "value": null, "evidence": null },
        "U9_technology_used": { "value": null, "evidence": null }
      },
      "interactions": {
        "I1_harvesting_levels_of_diverse_users": { "value": null, "evidence": null },
        "I2_information_sharing_among_users": { "value": null, "evidence": null },
        "I3_deliberation_processes": { "value": null, "evidence": null },
        "I4_conflicts_among_users": { "value": null, "evidence": null },
        "I5_investment_activities": { "value": null, "evidence": null },
        "I6_lobbying_activities": { "value": null, "evidence": null },
        "I7_self_organizing_activities": { "value": null, "evidence": null },
        "I8_networking_activities": { "value": null, "evidence": null }
      },
      "outcomes": {
        "O1_social_performance_measures": { "value": null, "evidence": null },
        "O2_ecological_performance_measures": { "value": null, "evidence": null },
        "O3_externalities_to_other_SESs": { "value": null, "evidence": null }
      },
      "related_ecosystems": {
        "ECO1_climate_patterns": { "value": null, "evidence": null },
        "ECO2_pollution_patterns": { "value": null, "evidence": null },
        "ECO3_flows_into_and_out_of_focal_SES": { "value": null, "evidence": null }
      }
    }
  ]
}
```
