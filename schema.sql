table_name,column_name,data_type
invites,created_at,timestamp with time zone
musician_directory,user_id,uuid
musician_profiles,weaknesses_counts,jsonb
musician_profiles,response_time_seconds_avg,integer
musician_profiles,attendance_rate,numeric
musician_profiles,is_trusted,boolean
musician_profiles,trusted_since,date
musician_profiles,created_at,timestamp with time zone
musician_profiles,updated_at,timestamp with time zone
contractor_profiles,user_id,uuid
active_blocks,created_at,timestamp with time zone
profiles,created_at,timestamp with time zone
musician_directory,avg_rating,numeric
musician_directory,rating_count,integer
musician_directory,is_trusted,boolean
musician_directory,trusted_since,date
confirmations,id,uuid
confirmations,invite_id,uuid
confirmations,musician_id,uuid
confirmations,confirmed,boolean
confirmations,confirmed_at,timestamp with time zone
confirmations,created_at,timestamp with time zone
gigs,id,uuid
gigs,contractor_id,uuid
contractor_profiles,created_at,timestamp with time zone
contractor_profiles,updated_at,timestamp with time zone
gig_roles,id,uuid
gig_roles,gig_id,uuid
gigs,latitude,numeric
gigs,longitude,numeric
profiles,updated_at,timestamp with time zone
gigs,start_time,timestamp with time zone
gigs,show_minutes,integer
gigs,break_minutes,integer
gigs,end_time,timestamp with time zone
gigs,status,USER-DEFINED
gigs,created_at,timestamp with time zone
gigs,updated_at,timestamp with time zone
gigs,created_by_musician,boolean
gig_roles,quantity,integer
active_blocks,id,uuid
musician_profiles,user_id,uuid
profiles,user_id,uuid
profiles,user_type,USER-DEFINED
active_blocks,musician_id,uuid
gig_roles,created_at,timestamp with time zone
ratings,id,uuid
ratings,gig_id,uuid
ratings,invite_id,uuid
ratings,contractor_id,uuid
ratings,musician_id,uuid
ratings,rating,integer
active_blocks,reason,USER-DEFINED
active_blocks,starts_at,timestamp with time zone
active_blocks,ends_at,timestamp with time zone
musician_profiles,avg_rating,numeric
ratings,created_at,timestamp with time zone
reliability_events,id,uuid
reliability_events,musician_id,uuid
reliability_events,gig_id,uuid
reliability_events,invite_id,uuid
reliability_events,event_type,USER-DEFINED
reliability_events,occurred_at,timestamp with time zone
musician_profiles,rating_count,integer
blocks,id,uuid
blocks,musician_id,uuid
blocks,reason,USER-DEFINED
blocks,starts_at,timestamp with time zone
blocks,ends_at,timestamp with time zone
blocks,created_at,timestamp with time zone
responsibility_terms,id,uuid
responsibility_terms,musician_id,uuid
responsibility_terms,accepted_at,timestamp with time zone
musician_profiles,strengths_counts,jsonb
responsibility_terms,ip_address,inet
favorites,contractor_id,uuid
favorites,musician_id,uuid
favorites,created_at,timestamp with time zone
band_musician_history,contractor_id,uuid
band_musician_history,musician_id,uuid
band_musician_history,last_gig_id,uuid
band_musician_history,last_played_at,timestamp with time zone
band_musician_history,play_count,integer
invites,id,uuid
invites,gig_id,uuid
invites,gig_role_id,uuid
invites,contractor_id,uuid
invites,musician_id,uuid
invites,status,USER-DEFINED
invites,invited_at,timestamp with time zone
invites,responded_at,timestamp with time zone
invites,accepted_at,timestamp with time zone
invites,cancelled_at,timestamp with time zone
invites,warned_short_gap,boolean
invites,warned_short_gap_minutes,integer
gigs,state,text
profiles,display_name,text
profiles,phone_e164,text
profiles,city,text
profiles,state,text
profiles,photo_url,text
musician_profiles,instruments,ARRAY
musician_profiles,genres,ARRAY
musician_profiles,skills,ARRAY
musician_profiles,setup,ARRAY
musician_profiles,bio,text
musician_profiles,portfolio_links,ARRAY
contractor_profiles,project_name,text
contractor_profiles,website,text
gig_roles,instrument,text
gig_roles,desired_genres,ARRAY
gig_roles,desired_skills,ARRAY
gig_roles,desired_setup,ARRAY
gig_roles,notes,text
ratings,strengths,ARRAY
ratings,weaknesses,ARRAY
ratings,public_comment,text
ratings,private_comment,text
reliability_events,notes,text
responsibility_terms,version,text
musician_directory,display_name,text
musician_directory,city,text
musician_directory,state,text
musician_directory,photo_url,text
musician_directory,instruments,ARRAY
musician_directory,genres,ARRAY
musician_directory,skills,ARRAY
musician_directory,setup,ARRAY
musician_directory,bio,text
musician_directory,portfolio_links,ARRAY
gigs,title,text
gigs,description,text
gigs,location_name,text
gigs,address_text,text
gigs,timezone,text
gigs,city,text